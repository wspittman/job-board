import express from "express";
import { getMetadata } from "../db/metadata";

export const metadataRouter = express.Router();

metadataRouter.get("/", async (_, res, next) => {
  try {
    const metadata = await getMetadata();
    res.json(metadata);
  } catch (error: any) {
    next(error);
  }
});
