import * as appInsights from "applicationinsights";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { config } from "./config";
import { connectDB } from "./db/db";
import { router } from "./routes/routes";

appInsights.setup(config.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

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
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
  });
});

connectDB().then(() => {
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
});
