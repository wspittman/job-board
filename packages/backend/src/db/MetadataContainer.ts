import { Container, type ContainerOptions } from "dry-utils-cosmosdb";
import type { CompanyQuickRef, Metadata } from "../models/models.ts";
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
    const { company } = await this.#cacheCompanyMeta();
    return company;
  }

  async getCompanyQuickRef(id: string) {
    const { quickRefMap } = await this.#cacheCompanyMeta();
    return quickRefMap.get(id);
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

  #cacheCompanyMeta = debouncePromise(() => this.#getCompanyEtc());
  #cacheJobMeta = debouncePromise(() => this.#get("job"));

  async #getCompanyEtc() {
    const meta = await this.#get("company");
    const company = meta?.id === "company" ? meta : undefined;
    const refs = company?.companyQuickRef ?? [];
    const quickRefMap = new Map(
      refs.map((x) => [x[0], x] as [string, CompanyQuickRef]),
    );
    return { company, quickRefMap };
  }

  async #get(id: Metadata["id"]) {
    return await this.getItem(id, id);
  }
}
