import { CosmosClient } from "@azure/cosmos";
import fs from "fs";
import https from "https";

const agent = new https.Agent({
  ca: fs.readFileSync("cosmosdbcert.cer"),
});

let cosmosClient: CosmosClient;

export const connectDB = async () => {
  try {
    cosmosClient = new CosmosClient({
      endpoint: "https://localhost:8081/",
      // Default key for local CosmosDB Emulator - not private
      key: "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
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
