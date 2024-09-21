import cors from "cors";
import express from "express";
import { connectDB } from "./config";
import { router } from "./routes";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", router);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
