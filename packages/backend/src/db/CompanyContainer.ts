import { Container, type DBOptions } from "dry-utils-cosmosdb";
import type { Company, CompanyKey, CompanyQuickRef } from "../models/models.ts";

const ContainerName = "company";

/** Database operations for ATS companies. */
export class CompanyContainer extends Container<Company> {
  /** Returns the Cosmos DB initialization options for this container. */
  static ContainerOptions(): DBOptions["containers"][number] {
    return {
      name: ContainerName,
      partitionKey: "ats",
      indexExclusions: ["/description/?", "/website/?"],
    };
  }

  /** Wraps an initialized company container. */
  constructor(container: Container<Company>) {
    super(ContainerName, container.container);
  }

  /** Gets a company by its ATS key. */
  async get({ id, ats }: CompanyKey) {
    return this.getItem(id, ats);
  }

  /** Gets company IDs for an ATS. */
  async getIds(ats: string) {
    return this.getIdsByPartitionKey(ats);
  }

  /** Gets all companies for an ATS. */
  async getAll(ats: string) {
    return this.getItemsByPartitionKey(ats);
  }

  /** Gets all company keys. */
  async getKeys() {
    return this.query<CompanyKey>(`SELECT c.id, c.ats FROM c`);
  }

  /** Gets compact company references used by job metadata. */
  async getQuickRefs(): Promise<CompanyQuickRef[]> {
    const refObjs = await this.query<{
      id: string;
      name: string;
      website?: string;
    }>("SELECT c.id, c.name, c.website FROM c");

    return refObjs.map(({ id, name, website }) => [id, name, website]);
  }

  /** Creates or updates a company. */
  async upsert(company: Company) {
    await this.upsertItem(company);
  }

  /** Removes a company. */
  async remove({ id, ats }: CompanyKey) {
    return this.deleteItem(id, ats);
  }
}
