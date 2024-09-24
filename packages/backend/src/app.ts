import cors from "cors";
import express, { Request, Response } from "express";
import { config } from "./config";
import { connectDB } from "./db/db";
import { router } from "./routes";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", router);

// For nonexistent routes
app.use((_: Request, res: Response) => {
  res.status(404).send("Not Found");
});

connectDB().then(() => {
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
});
