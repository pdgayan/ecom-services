const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const knexLib = require("knex");

async function migrate() {
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  const secret = await client.send(
    new GetSecretValueCommand({
      SecretId: process.env.DB_SECRET_ARN,
    })
  );

  const creds = JSON.parse(secret.SecretString);

  process.env.DB_USER = creds.username;
  process.env.DB_PASSWORD = creds.password;

  const knex = knexLib(require("./knexfile"));

  await knex.migrate.latest();

  console.log("✅ Migrations completed.");

  await knex.destroy();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});