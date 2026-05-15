import type { FormOption } from "../components/form-element";
import { fmt } from "../utils/format";
import { api } from "./api";
import { toJobFamilyLabel } from "./apiEnums";

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
    return fmt.dateTime(timestamp);
  }

  /**
   * Retrieves the formatted strings for metadata counts.
   * @returns An object containing formatted strings.
   */
  async getCountStrings(): Promise<{
    companyCount: string;
    jobCount: string;
    recentJobCount: string;
    remotePct: string;
    topJobFamilies: { pct: string; label: string }[];
  }> {
    const {
      companyCount,
      jobCount,
      recentJobCount,
      presenceCounts,
      jobFamilyCounts,
    } = await this.#fetch();

    const remotePct = fmt.percent(presenceCounts.remote, jobCount);
    const topJobFamilies = Object.entries(jobFamilyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key, count]) => ({
        pct: fmt.percent(count, jobCount),
        label: toJobFamilyLabel(key),
      }));

    return {
      companyCount: fmt.number(companyCount),
      jobCount: fmt.number(jobCount),
      recentJobCount: fmt.number(recentJobCount),
      remotePct,
      topJobFamilies,
    };
  }

  /**
   * Retrieves company names in a format suitable for form options.
   * @returns The array of form options for companies.
   */
  async getCompanyFormOptions(): Promise<FormOption[]> {
    const { companyNames } = await this.#fetch();
    return fmt.sortedOptions(companyNames);
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
