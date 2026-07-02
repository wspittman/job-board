import { batch } from "dry-utils-async";
import { Container, type ContainerOptions } from "dry-utils-cosmosdb";
import type { CompanyKey, ETag } from "../models/models.ts";
import { normalizeId } from "./utils.ts";

const ContainerName = "etag";

/** Point-read map between ATS resources and their latest ETags. */
export class ETagContainer extends Container<ETag> {
  /** Returns the Cosmos DB initialization options for this container. */
  static ContainerOptions(): ContainerOptions {
    return {
      name: ContainerName,
      partitionKey: "atsCompany",
      ttlSeconds: 30 * 24 * 60 * 60,
      indexExclusions: "all",
    };
  }

  /** Wraps an initialized ETag container. */
  constructor(container: Container<ETag>) {
    super(ContainerName, container.container);
  }

  /** Gets the latest saved ETag for an ATS resource. */
  async get(id: string, key: CompanyKey) {
    const result = await this.getItem(normalizeId(id), this.#asPKey(key));
    return result?.etag;
  }

  /** Saves the latest ETag for an ATS resource. */
  async set(id: string, key: CompanyKey, etag: string) {
    await this.upsertItem({
      id: normalizeId(id),
      atsCompany: this.#asPKey(key),
      etag,
    });
  }

  /** Removes all etags for a company. */
  async deleteAll(key: CompanyKey) {
    const pKey = this.#asPKey(key);
    const ids = await this.getIdsByPartitionKey(pKey);
    if (!ids.length) return [];

    return await batch("DeleteAllETag", ids, (id) => this.deleteItem(id, pKey));
  }

  #asPKey({ ats, id }: CompanyKey) {
    return `${ats}+${id}`;
  }
}
