import type { FormOption } from "../components/form-element";
import { api } from "./api";

/**
 * Manages metadata related to job listings, such as company names, job counts, and timestamps.
 * Provides methods to fetch and format this data for display.
 */
class MetadataModel {
  #companyNameMap = new Map<string, string>();

  /**
   * Retrieves the formatted timestamp string of the last metadata update.
   * @returns The formatted timestamp string.
   */
  async getTimestampString(): Promise<string> {
    const { timestamp } = await this.#fetch();
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Retrieves the formatted counts of jobs and companies.
   * @returns The formatted job and company counts.
   */
  async getCountStrings(): Promise<{ jobCount: string; companyCount: string }> {
    const { jobCount, companyCount } = await this.#fetch();
    return {
      jobCount: jobCount.toLocaleString(),
      companyCount: companyCount.toLocaleString(),
    };
  }

  /**
   * Retrieves company names in a format suitable for form options.
   * @returns The array of form options for companies.
   */
  async getCompanyFormOptions(): Promise<FormOption[]> {
    const { companyNames } = await this.#fetch();
    return companyNames
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Retrieves the friendly name of a company given its ID.
   * @param companyId - The ID of the company.
   * @returns The friendly name of the company, or undefined if not found.
   */
  getCompanyFriendlyName(companyId: string): string | undefined {
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
