import cors from "cors";
import express from "express";
import { config } from "./config";
import { connectDB } from "./db/db";
import { router } from "./routes";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", router);

connectDB().then(() => {
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
});
