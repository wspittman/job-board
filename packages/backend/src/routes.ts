import express from "express";
import { exampleRead } from "./services/db";

export const router = express.Router();

router.get("/", async (req, res) => {
  const items = await exampleRead();
  res.send("API is working: " + JSON.stringify(items));
});
