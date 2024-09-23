import {
  Container,
  CosmosClient,
  JSONValue,
  SqlQuerySpec,
} from "@azure/cosmos";
import fs from "fs";
import https from "https";
import { config } from "../config";

const DB_NAME = "jobboard";

type ATS = "greenhouse" | "lever";

interface Item {
  id: string;
  _rid: string;
  _self: string;
  _etag: string;
  _attachments: string;
  _ts: number;
}

/**
 * - id: The ATS company name
 * - pKey: ats
 */
interface Company {
  id: string;
  ats: ATS;
}

/**
 * - id: DB-generated
 * - pKey: company
 */
export interface Job {
  company: string;
  title: string;
  description: string;
  postDate: string;
  applyUrl: string;
}

let companyContainer: Container;
let jobContainer: Container;

export async function addCompany(company: Company) {
  upsert(companyContainer, company);
}

export async function getCompanies(ats: ATS) {
  return queryFilters<Company>(companyContainer, { ats });
}

export async function addJob(job: Job) {
  upsert(jobContainer, job);
}

export async function getJobs(company: string) {
  return queryFilters<Job>(jobContainer, { company });
}

async function upsert(container: Container, item: Object) {
  const f = await container.items.upsert(item);
  console.log(f);
}

async function queryFilters<T>(container: Container, filters: Partial<T>) {
  const entries: [string, JSONValue][] = Object.entries(filters);

  const whereClause = entries
    .map(([key]) => `c.${key} = @${key}`)
    .join(" AND ");

  const parameters = entries.map(([key, value]) => ({
    name: `@${key}`,
    value,
  }));

  return query<T>(container, {
    query: `SELECT * FROM c WHERE ${whereClause}`,
    parameters,
  });
}

async function query<T>(container: Container, query: string | SqlQuerySpec) {
  const { resources } = await container.items.query(query).fetchAll();
  return resources.map((entry) => stripItem<T>(entry));
}

function stripItem<T>(entry: Item): T & { id: string } {
  const { _rid, _self, _etag, _attachments, _ts, ...rest } = entry;
  return rest as T & { id: string };
}

export async function connectDB() {
  try {
    const agent = new https.Agent({
      ca: fs.readFileSync(config.DATABASE_LOCAL_CERT_PATH),
    });

    const cosmosClient = new CosmosClient({
      endpoint: config.DATABASE_URL,
      key: config.DATABASE_KEY,
      agent,
    });

    const { database } = await cosmosClient.databases.createIfNotExists({
      id: DB_NAME,
    });

    let containerResult = await database.containers.createIfNotExists({
      id: "company",
      partitionKey: {
        paths: ["/ats"],
      },
    });
    companyContainer = containerResult.container;

    containerResult = await database.containers.createIfNotExists({
      id: "job",
      partitionKey: {
        paths: ["/company"],
      },
    });
    jobContainer = containerResult.container;

    console.log("CosmosDB connected");
  } catch (error) {
    console.error("CosmosDB connection error:", error);
    process.exit(1);
  }
}
