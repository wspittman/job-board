import { logError, startTelemetry } from "./utils/telemetry.ts";

// We need this as early as possible, for reasons
await startTelemetry();

import cors from "cors";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import helmet from "helmet";
import { config } from "./config.ts";
import { db } from "./db/db.ts";
import { router } from "./routes/routes.ts";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api", router);

// For nonexistent routes
app.use((_: Request, res: Response) => {
  res.status(404).send("Not Found");
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logError(err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
  });
});

/**
 * Starts the server after establishing database connection
 */
async function startServer() {
  try {
    await db.connect();

    app.listen(config.PORT, () => {
      console.log(`Server running on port ${config.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    logError(error);
    process.exit(1);
  }
}

// Initialize server
startServer();
