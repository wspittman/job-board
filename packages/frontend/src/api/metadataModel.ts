import type { FormOption } from "../components/form-element";
import { fmt } from "../utils/format";
import { api } from "./api";
import {
  companyStageProgression,
  toCompanyStageLabel,
  toJobFamilyLabel,
  toPresenceLabel,
  toUsStateLabel,
  toWorkTimeBasisLabel,
} from "./apiEnums";
import type { SalaryStat } from "./apiTypes";

export interface MetadataSeries {
  label: string;
  count: number;
  pct: number;
}

type CountRecord<T extends string> = Partial<Record<T, number>>;

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
   * Retrieves all job family counts as chart-ready series data.
   * @returns Job family entries sorted by count descending.
   */
  async getJobFamilySeries(): Promise<MetadataSeries[]> {
    const { jobCount, jobFamilyCounts } = await this.#fetch();
    return countRecordToSeries(jobFamilyCounts, jobCount, toJobFamilyLabel);
  }

  /**
   * Retrieves presence mode counts as chart-ready series data.
   * @returns Presence entries in a stable display order.
   */
  async getPresenceSeries(): Promise<MetadataSeries[]> {
    const { jobCount, presenceCounts } = await this.#fetch();
    return countRecordToSeries(presenceCounts, jobCount, toPresenceLabel, [
      "remote",
      "hybrid",
      "onsite",
    ]);
  }

  /**
   * Retrieves work time basis counts as chart-ready series data.
   * @returns Work time entries in a stable display order.
   */
  async getWorkTimeSeries(): Promise<MetadataSeries[]> {
    const { jobCount, workTimeCounts } = await this.#fetch();
    return countRecordToSeries(workTimeCounts, jobCount, toWorkTimeBasisLabel, [
      "full_time",
      "part_time",
      "variable",
      "per_diem",
    ]);
  }

  /**
   * Retrieves job-weighted company stage counts as chart-ready series data.
   * @returns Company stage entries sorted by funding progression.
   */
  async getCompanyStageSeries(): Promise<MetadataSeries[]> {
    const { jobCount, stageCounts } = await this.#fetch();
    return countRecordToSeries(
      stageCounts,
      jobCount,
      toCompanyStageLabel,
      companyStageProgression,
    );
  }

  /**
   * Retrieves the top location counts as chart-ready series data.
   * @returns State and territory entries sorted by count descending.
   */
  async getTopLocations(): Promise<MetadataSeries[]> {
    const { jobCount, topLocationCounts } = await this.#fetch();
    return countRecordToSeries(topLocationCounts, jobCount, toUsStateLabel);
  }

  /**
   * Retrieves annual salary percentile buckets.
   * @returns Salary stats emitted by backend metadata aggregation.
   */
  async getSalaryStats(): Promise<SalaryStat[]> {
    const { salaryStats } = await this.#fetch();
    return salaryStats;
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

function countRecordToSeries<T extends string>(
  counts: CountRecord<T>,
  total: number,
  toLabel: (value: unknown) => string,
  order?: readonly T[],
): MetadataSeries[] {
  const entries = order
    ? order.map((key) => [key, counts[key]] as const)
    : (Object.entries(counts) as [T, number | undefined][]).sort(
        ([, a], [, b]) => (b ?? 0) - (a ?? 0),
      );

  return entries
    .map(([key, count = 0]) => ({
      label: toLabel(key),
      count,
      pct: toPct(count, total),
    }))
    .filter(({ label, count }) => label && count > 0);
}

function toPct(value: number = 0, total: number = 0): number {
  value = Math.max(value, 0);
  total = Math.max(total, 0);
  return total > 0 ? (value / total) * 100 : 0;
}

export const metadataModel = new MetadataModel();
