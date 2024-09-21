import cors from "cors";
import express from "express";
import { config } from "./config";
import { router } from "./routes";
import { connectDB } from "./services/db";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", router);

connectDB().then(() => {
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
});
