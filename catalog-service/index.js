require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const pg = require("pg");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
pg.types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

// ---------------------------------------------------
// Fetch DB credentials from AWS Secrets Managers
// Uses IRSA automatically - no AWS keys needed here
// ---------------------------------------------------
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

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid authorization format" });
  }

  try {
    const decoded = jwt.verify(
      parts[1],
      process.env.JWT_SECRET || "development-secret",
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

function requireSeller(req, res, next) {
  const role = normalizeRole(req.user?.role);

  if (role !== "seller") {
    return res.status(403).json({ message: "Seller access required" });
  }

  next();
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

// ---------------------------------------------------
// Resolves DB configurations
// Host/Port/Database -> Kubernetes env vars
// Username/Password -> AWS Secrets Manager
// ---------------------------------------------------
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

function buildProductPayload(body, existingId) {
  return {
    id: existingId || body.id || crypto.randomUUID(),
    name: body.name,
    manufacturer: body.manufacturer || null,
    category: body.category || null,
    categoryId: body.categoryId || null,
    image_url: body.image_url || null,
    availability: body.availability || null,
    certification: body.certification ?? null,
    country: body.country || null,
    stock: body.stock ?? null,
    leadTime: body.leadTime || null,
    price: body.price ?? null,
    priceUnit: body.priceUnit || null,
    description: body.description || null,
    specifications: body.specifications ?? null,
    documents: body.documents ?? null,
    supplierId: body.supplierId || null,
    condition: body.condition || null,
    natoStockNumber: body.natoStockNumber || null,
    exportControl: body.exportControl || null,
    updated_at: new Date(),
  };
}

function getS3BucketName() {
  return process.env.S3_BUCKET_NAME || "ecom-product-images-test-bucket";
}

function buildPublicS3Url(key) {
  const region = process.env.AWS_REGION || "us-east-1";
  const bucketName = getS3BucketName();
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

async function uploadImageToS3(file) {
  if (!file) {
    throw new Error("No image file provided");
  }

  const bucketName = getS3BucketName();
  const extension = file.originalname?.match(/\.[^.]+$/)?.[0] || ".jpg";
  const key = `products/${Date.now()}-${crypto.randomUUID()}${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
    }),
  );

  return buildPublicS3Url(key);
}

function productRouter() {
  const router = express.Router();

  router.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/products", async (req, res) => {
    try {
      const products = await app.locals
        .knex("products")
        .select("*")
        .orderBy("created_at", "desc");
      res.json(products);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to fetch products", error: err.message });
    }
  });

  router.get("/products/:id", async (req, res) => {
    try {
      const product = await app.locals
        .knex("products")
        .where({ id: req.params.id })
        .first();
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to fetch product", error: err.message });
    }
  });

  router.post(
    "/products/upload",
    authenticateToken,
    requireSeller,
    upload.single("image"),
    async (req, res) => {
      try {
        const imageUrl = await uploadImageToS3(req.file);
        res.status(201).json({ imageUrl });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Image upload failed", error: err.message });
      }
    },
  );

  router.post(
    "/products",
    authenticateToken,
    requireSeller,
    async (req, res) => {
      try {
        if (!req.body || !req.body.name) {
          return res.status(400).json({ message: "name is required" });
        }

        const payload = buildProductPayload(req.body);
        payload.created_at = new Date();

        const inserted = await app.locals
          .knex("products")
          .insert(payload)
          .returning("*");
        res.status(201).json(inserted[0] || payload);
      } catch (err) {
        res
          .status(500)
          .json({ message: "Failed to create product", error: err.message });
      }
    },
  );

  router.put(
    "/products/:id",
    authenticateToken,
    requireSeller,
    async (req, res) => {
      try {
        const payload = buildProductPayload(req.body || {}, req.params.id);
        delete payload.id;

        const updated = await app.locals
          .knex("products")
          .where({ id: req.params.id })
          .update(payload)
          .returning("*");

        if (!updated.length) {
          return res.status(404).json({ message: "Product not found" });
        }

        res.json(updated[0]);
      } catch (err) {
        res
          .status(500)
          .json({ message: "Failed to update product", error: err.message });
      }
    },
  );

  router.delete(
    "/products/:id",
    authenticateToken,
    requireSeller,
    async (req, res) => {
      try {
        const deleted = await app.locals
          .knex("products")
          .where({ id: req.params.id })
          .del()
          .returning("*");

        if (!deleted.length) {
          return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product deleted" });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Failed to delete product", error: err.message });
      }
    },
  );

  return router;
}

// ---------------------------------------------------
// Examples: fetch credentials once at startup
// ---------------------------------------------------
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

  app.use("/catalog", productRouter());
  app.use(productRouter());

  const PORT = process.env.PORT || 4002;

  app.listen(PORT, () => {
    console.log(`catalog-service running on port ${PORT}`);
  });
}

startServer();
