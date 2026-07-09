import { Container, type ContainerOptions } from "dry-utils-cosmosdb";
import type { Metadata } from "../models/models.ts";
import { debouncePromise } from "../utils/debounceUtils.ts";

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
    const doc = await this.#cacheCompanyMeta();
    // For proper return type
    return doc?.id === "company" ? doc : undefined;
  }

  async getJob() {
    const doc = await this.#cacheJobMeta();
    // For proper return type
    return doc?.id === "job" ? doc : undefined;
  }

  /** Creates or updates a metadata document. */
  async upsert(metadata: Metadata) {
    await this.upsertItem(metadata);

    if (metadata.id === "company") {
      this.#cacheCompanyMeta.clear();
    } else {
      this.#cacheJobMeta.clear();
    }
  }

  #cacheCompanyMeta = debouncePromise(() => this.#get("company"));
  #cacheJobMeta = debouncePromise(() => this.#get("job"));

  async #get(id: Metadata["id"]) {
    return await this.getItem(id, id);
  }
}
