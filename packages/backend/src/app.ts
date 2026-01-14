import { logError, startTelemetry } from "./utils/telemetry.ts";

// We need this as early as possible, for reasons
startTelemetry();

import cors from "cors";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import helmet from "helmet";
import { config } from "./config.ts";
import { db } from "./db/db.ts";
import { logIdentifiers } from "./middleware/logRequestIdentifiers.ts";
import { router } from "./routes/routes.ts";
import { AppError } from "./utils/AppError.ts";

const app = express();

app.use(helmet());
app.use(cors({ maxAge: 86400 }));
app.use(express.json());
app.use(logIdentifiers);

app.use("/api", router);

// For nonexistent routes
app.use((_: Request, res: Response) => {
  res.status(404).send("Not Found");
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logError(err);
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode || statusCode;
  }

  if (err instanceof Error) {
    message = err.message || message;
  }

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
  });
});

function serverStartErrorHandler(error: unknown) {
  console.error("Failed to start server:", error);
  logError(error);
  process.exit(1);
}

/**
 * Starts the server after establishing database connection
 */
async function startServer() {
  try {
    await db.connect();

    app.listen(config.PORT, (error) => {
      if (error) {
        serverStartErrorHandler(error);
        return;
      }
      console.log(`Server running on port ${config.PORT}`);
    });
  } catch (error) {
    serverStartErrorHandler(error);
  }
}

// Initialize server
void startServer();
