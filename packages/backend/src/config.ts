import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  PORT: parseInt(process.env.PORT || "3000", 10),

  // Database configs
  DATABASE_URL: process.env.DATABASE_URL || "https://localhost:8081",
  DATABASE_KEY:
    process.env.DATABASE_KEY ||
    // Default key for local CosmosDB Emulator - not private
    "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
  DATABASE_LOCAL_CERT_PATH:
    process.env.DATABASE_LOCAL_CERT_PATH ||
    path.resolve(__dirname, "../cosmosdbcert.cer"),

  // ATS configs
  GREENHOUSE_URL:
    process.env.GREENHOUSE_URL || "https://boards-api.greenhouse.io/v1/boards",
  LEVER_URL: process.env.LEVER_URL || "https://api.lever.co/v0/postings",

  // AI configs
  // OPENAI_API_KEY present in .env, referenced directly in OpenAI SDK

  // Auth configs
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || "admin",
};
