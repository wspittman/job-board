import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

interface Config {
  PORT: number;
  DATABASE_URL: string;
  DATABASE_KEY: string;
  DATABASE_LOCAL_CERT_PATH: string;
}

export const config: Config = {
  PORT: parseInt(process.env.PORT || "3000", 10),

  DATABASE_URL: process.env.DATABASE_URL || "https://localhost:8081",
  DATABASE_KEY:
    process.env.DATABASE_KEY ||
    // Default key for local CosmosDB Emulator - not private
    "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
  DATABASE_LOCAL_CERT_PATH:
    process.env.DATABASE_LOCAL_CERT_PATH ||
    path.resolve(__dirname, "../cosmosdbcert.cer"),
};
