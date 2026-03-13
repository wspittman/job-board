import { getStorageIds } from "../utils/storage";
import { api } from "./api";
import {
  toCompanyStageLabel,
  toCurrencyFormat,
  toJobFamilyLabel,
  toPayCadenceLabel,
  toWorkTimeBasisLabel,
} from "./apiEnums";
import type { JobModelApi } from "./apiTypes";
import type { FilterModel } from "./filterModel";
import { metadataModel } from "./metadataModel";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export class JobModel {
  static async search(filters: FilterModel): Promise<JobModel[]> {
    if (filters.isEmpty()) return [];
    const params = filters.toUrlSearchParams().toString();
    const jobsApi = await api.fetchJobs(params);
    return jobsApi.map((jobApi) => new JobModel(jobApi));
  }

  readonly #job: JobModelApi;

  constructor(job: JobModelApi) {
    this.#job = job;
  }

  get id(): string {
    return this.#job.id;
  }

  get description(): string {
    return this.#job.description;
  }

  get companyWebsite(): string | undefined {
    return this.#job.companyWebsite;
  }

  get applyUrl(): string {
    const idQuery = new URLSearchParams(getStorageIds()).toString();
    return "/api" + this.#job.applyUrl + (idQuery ? "&" + idQuery : "");
  }

  get bookmarkUrl(): string {
    const base = `${location.origin}${location.pathname}`;
    return `${base}?companyId=${this.#job.companyId}&jobId=${this.#job.id}`;
  }

  getDisplayDetail() {
    const { title, company, facets } = this.#job;
    const { summary } = facets ?? {};
    const companyFriendly = metadataModel.getCompanyFriendlyName(company);

    return {
      title,
      company: companyFriendly ?? company,
      summary,
    };
  }

  getDisplayFacets(useShort = false): string[] {
    const { workTimeBasis, jobFamily, minSalary } = this.#job;

    const loc = this.#getLocationFacet(useShort);
    const post = this.#getPostFacet(useShort);

    const p1: string[] = [];
    const p2: string[] = [];
    const p3: string[] = [];

    const pushIf = (
      condition: boolean,
      pIf?: string[],
      pElse?: string[],
      value?: string,
    ) => {
      if (value == null || value === "") return;
      (condition ? pIf : pElse)?.push(value);
    };

    pushIf(useShort && !post.endsWith("days ago"), p1, p3, post);
    pushIf(loc === "Remote", p1, p2, loc);
    pushIf(minSalary != null, p1, p3, this.#getCompString(useShort));
    pushIf(true, p2, undefined, this.#getExperienceFacet(useShort));
    pushIf(true, p2, undefined, toJobFamilyLabel(jobFamily));
    pushIf(true, p2, undefined, toWorkTimeBasisLabel(workTimeBasis));
    pushIf(true, p2, undefined, this.#getStageFacet(useShort));

    return [...p1, ...p2, ...p3.reverse()];
  }

  #getLocationFacet(useShort: boolean): string {
    const { isRemote, location } = this.#job;

    return isRemote
      ? "Remote"
      : useShort && location.includes(",")
        ? location.slice(0, location.lastIndexOf(","))
        : location;
  }

  #getExperienceFacet(useShort: boolean): string | undefined {
    const { facets } = this.#job;
    const { experience } = facets ?? {};

    if (experience == null) return undefined;

    return useShort
      ? `${experience} yrs exp`
      : `${experience} years experience required`;
  }

  #getPostFacet(useShort: boolean): string {
    const { postTS } = this.#job;

    return useShort
      ? this.#tsToDaysString(postTS)
      : new Date(postTS).toLocaleDateString();
  }

  #tsToDaysString(ts: number): string {
    const days = Math.floor((Date.now() - ts) / MS_PER_DAY);
    if (days === 0) return "Just Posted";
    if (days < 7) return "New";
    if (days < 30) return "Recent";
    return `${days} days ago`;
  }

  #getStageFacet(useShort: boolean): string | undefined {
    const { companyStage } = this.#job;

    const stageLabel = toCompanyStageLabel(companyStage);
    return useShort || !stageLabel ? stageLabel : `${stageLabel} Company`;
  }

  #getCompString(useShort: boolean): string | undefined {
    const { minSalary, payCadence, currency } = this.#job;
    const cadence = toPayCadenceLabel(payCadence) || undefined;

    if (minSalary != null) {
      const noCurrencyPrefix = cadence ? "" : "Pay: ";
      const amount = toCurrencyFormat(minSalary, currency, noCurrencyPrefix);
      return cadence ? `${amount} / ${cadence}` : `${amount}`;
    }

    if (useShort && (!payCadence || payCadence === "salary")) return undefined;

    if (cadence) {
      return `Per ${cadence}${currency ? ` (${currency})` : ""}`;
    }

    return currency;
  }
}
