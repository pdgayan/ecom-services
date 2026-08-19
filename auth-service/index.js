const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pg = require("pg");
pg.types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const app = express();

app.use(cors());
app.use(express.json());

const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || "us-east-1",
});

let dbCredentials = null;

function normalizeRole(role) {
  if (!role) {
    return null;
  }

  const normalized = String(role).toLowerCase();

  if (normalized === "buyer" || normalized === "customer") {
    return "buyer";
  }

  if (normalized === "seller" || normalized === "admin") {
    return "seller";
  }

  return null;
}

async function getDbCredentials() {
  if (dbCredentials) {
    return dbCredentials;
  }

  const command = new GetSecretValueCommand({
    SecretId: process.env.DB_SECRET_ARN,
  });

  const response = await secretsClient.send(command);

  if (!response.SecretString) {
    throw new Error("Secret value is empty or binary, expected SecretString.");
  }

  dbCredentials = JSON.parse(response.SecretString);
  return dbCredentials;
}

async function resolveDbConfig() {
  if (!process.env.DB_HOST) {
    throw new Error("DB_HOST environment variable is missing.");
  }

  if (!process.env.DB_PORT) {
    throw new Error("DB_PORT environment variable is missing.");
  }

  if (!process.env.DB_NAME) {
    throw new Error("DB_NAME environment variable is missing.");
  }

  if (!process.env.DB_SECRET_ARN) {
    throw new Error("DB_SECRET_ARN environment variable is missing.");
  }

  const secret = await getDbCredentials();

  console.log("Secret keys:", Object.keys(secret));

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: secret.username,
    password: secret.password,
  };
}

function buildUserPayload(body, passwordHash, existingId, role = "buyer") {
  const now = new Date();

  return {
    id: existingId || crypto.randomUUID(),
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    password_hash: passwordHash,
    phone: body.phone || null,
    role: normalizeRole(role) || "buyer",
    is_verified:
      typeof body.is_verified === "boolean" ? body.is_verified : false,
    created_at: now,
    updated_at: now,
  };
}

function sanitizeUser(user) {
  if (!user) {
    return user;
  }

  const { password_hash, ...safeUser } = user;
  return safeUser;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid authorization format" });
  }

  const token = parts[1];

  jwt.verify(
    token,
    process.env.JWT_SECRET || "development-secret",
    (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }

      req.user = decoded;
      next();
    },
  );
}

//apis

function authRouter() {
  const router = express.Router();

  // Health Check
  router.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Register
  router.post("/register", async (req, res) => {
    try {
      const { first_name, last_name, email, password, role } = req.body;

      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({
          message: "first_name, last_name, email and password are required",
        });
      }

      const knex = req.app.locals.knex;

      const existing = await knex("users").where({ email }).first();

      if (existing) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const requestedRole = normalizeRole(role || "buyer");

      if (!requestedRole) {
        return res
          .status(400)
          .json({ message: "role must be buyer or seller" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const payload = buildUserPayload(
        req.body,
        passwordHash,
        undefined,
        requestedRole,
      );

      const [insertedUser] = await knex("users").insert(payload).returning("*");

      res.status(201).json({
        message: "User registered successfully",
        user: sanitizeUser(insertedUser),
      });
    } catch (error) {
      console.error("Register error:", error);
      res
        .status(500)
        .json({ message: "Failed to register user", error: error.message });
    }
  });

  // Logins
  router.post("/login", async (req, res) => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "email and password are required" });
      }

      const requestedRole = normalizeRole(role || "buyer");

      if (!requestedRole) {
        return res
          .status(400)
          .json({ message: "role must be buyer or seller" });
      }

      const knex = req.app.locals.knex;

      const user = await knex("users").where({ email }).first();

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const userRole = normalizeRole(user.role) || "buyer";

      if (requestedRole !== userRole) {
        return res.status(403).json({
          message: `This account is registered as ${userRole}. Please log in with the correct role.`,
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: userRole,
        },
        process.env.JWT_SECRET || "development-secret",
        { expiresIn: "1d" },
      );

      res.json({
        token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: userRole,
          phone: user.phone,
          is_verified: user.is_verified,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res
        .status(500)
        .json({ message: "Failed to login", error: error.message });
    }
  });

  /// Get Profile
  router.get("/profile", authenticateToken, async (req, res) => {
    try {
      const knex = req.app.locals.knex;

      const user = await knex("users").where({ id: req.user.id }).first();

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User Profile", user: sanitizeUser(user) });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch profile", error: error.message });
    }
  });

  // Update Profile
  router.put("/profile", authenticateToken, async (req, res) => {
    try {
      const knex = req.app.locals.knex;

      const { first_name, last_name, phone } = req.body;

      const updatePayload = {
        updated_at: new Date(),
      };

      if (first_name !== undefined) {
        updatePayload.first_name = first_name;
      }

      if (last_name !== undefined) {
        updatePayload.last_name = last_name;
      }

      if (phone !== undefined) {
        updatePayload.phone = phone;
      }

      const [updatedUser] = await knex("users")
        .where({ id: req.user.id })
        .update(updatePayload)
        .returning("*");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile Updated",
        user: sanitizeUser(updatedUser),
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res
        .status(500)
        .json({ message: "Failed to update profile", error: error.message });
    }
  });

  return router;
}

async function startServer() {
  try {
    const dbConfig = await resolveDbConfig();

    console.log("========== DB CONFIG ==========");
    console.log("Host:", dbConfig.host);
    console.log("Port:", dbConfig.port);
    console.log("Database:", dbConfig.database);
    console.log("User:", dbConfig.user);
    console.log("Password:", dbConfig.password ? "***" : "undefined");
    console.log("===============================");

    process.env.DB_HOST = dbConfig.host;
    process.env.DB_PORT = String(dbConfig.port);
    process.env.DB_NAME = dbConfig.database;
    process.env.DB_USER = dbConfig.user;
    process.env.DB_PASSWORD = dbConfig.password;

    const knex = require("knex");
    const knexConfig = require("./knexfile");

    app.locals.knex = knex(knexConfig);

    await app.locals.knex.raw("SELECT 1");

    console.log("✅ Database connected successfully.");
  } catch (err) {
    console.error("❌ Failed to initialize database:", err);
    process.exit(1);
  }

  app.use("/auth", authRouter());
  app.use(authRouter());

  const PORT = process.env.PORT || 4001;

  app.listen(PORT, () => {
    console.log(`auth-service running on port ${PORT}`);
  });
}

startServer();
