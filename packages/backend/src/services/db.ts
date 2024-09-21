import { CosmosClient } from "@azure/cosmos";
import fs from "fs";
import https from "https";
import { config } from "../config";

const agent = new https.Agent({
  ca: fs.readFileSync(config.DATABASE_LOCAL_CERT_PATH),
});

let cosmosClient: CosmosClient;

export const connectDB = async () => {
  try {
    cosmosClient = new CosmosClient({
      endpoint: config.DATABASE_URL,
      key: config.DATABASE_KEY,
      agent,
    });

    // Template junk from emulator how-to

    const { database } = await cosmosClient.databases.createIfNotExists({
      id: "cosmicworks",
      throughput: 400,
    });

    const { container } = await database.containers.createIfNotExists({
      id: "products",
      partitionKey: {
        paths: ["/id"],
      },
    });

    const item = {
      id: "68719518371",
      name: "Kiama classic surfboard",
    };

    container.items.upsert(item);

    console.log("CosmosDB connected");
  } catch (error) {
    console.error("CosmosDB connection error:", error);
    process.exit(1);
  }
};

export const exampleRead = async () => {
  const f = await cosmosClient
    .database("cosmicworks")
    .container("products")
    .items.readAll()
    .fetchAll();
  return f.resources;
};
