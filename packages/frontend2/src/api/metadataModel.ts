import type { FormOption } from "../components/form-element";
import { api } from "./api";

class MetadataModel {
  #companyNameMap = new Map<string, string>();

  async getTimestampString(): Promise<string> {
    const { timestamp } = await this.#fetch();
    return new Date(timestamp).toLocaleString();
  }

  async getCountStrings(): Promise<{ jobCount: string; companyCount: string }> {
    const { jobCount, companyCount } = await this.#fetch();
    return {
      jobCount: jobCount.toLocaleString(),
      companyCount: companyCount.toLocaleString(),
    };
  }

  async getCompanyFormOptions(): Promise<FormOption[]> {
    const { companyNames } = await this.#fetch();
    return companyNames.map(([value, label]) => ({ value, label }));
  }

  async getCompanyFriendlyName(companyId: string): Promise<string | undefined> {
    return this.#companyNameMap.get(companyId);
  }

  async #fetch() {
    // Request caching happens here
    const data = await api.fetchMetadata();

    // But we also don't want to rebuild this map on every request
    if (data.companyCount !== this.#companyNameMap.size) {
      this.#companyNameMap = new Map<string, string>(data.companyNames);
    }

    return data;
  }
}

export const metadataModel = new MetadataModel();
