import { Container, type ContainerOptions } from "dry-utils-cosmosdb";
import type { Metadata } from "../models/models.ts";

const ContainerName = "metadata";

/** Aggregated metadata. */
export class MetadataContainer extends Container<Metadata> {
  /** Returns the Cosmos DB initialization options for this container. */
  static ContainerOptions(): ContainerOptions {
    return {
      name: ContainerName,
      partitionKey: "id",
      indexExclusions: "all",
    };
  }

  /** Wraps an initialized metadata container. */
  constructor(container: Container<Metadata>) {
    super(ContainerName, container.container);
  }

  async getCompany() {
    const doc = await this.getItem("company", "company");
    // For proper return type
    return doc?.id === "company" ? doc : undefined;
  }

  async getJob() {
    const doc = await this.getItem("job", "job");
    // For proper return type
    return doc?.id === "job" ? doc : undefined;
  }

  /** Creates or updates a metadata document. */
  async upsert(metadata: Metadata) {
    await this.upsertItem(metadata);
  }
}
