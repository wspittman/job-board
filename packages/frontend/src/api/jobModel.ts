import { api, API_URL } from "./api";
import {
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

  get applyUrl(): string {
    return API_URL + this.#job.applyUrl;
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

  getDisplayFacets(useShort = false) {
    const { isRemote, location, postTS, facets, workTimeBasis, jobFamily } =
      this.#job;
    const { experience } = facets ?? {};

    let loc = location;
    if (isRemote) {
      loc = "Remote";
    } else if (useShort) {
      const locBreak = loc.lastIndexOf(",");
      loc = locBreak === -1 ? loc : loc.slice(0, locBreak);
    }

    let exp: string | undefined = undefined;
    if (experience != null) {
      exp = useShort
        ? `${experience} yrs exp`
        : `${experience} years experience required`;
    }

    const post = useShort
      ? this.#tsToDaysString(postTS)
      : new Date(postTS).toLocaleDateString();
    const isPrePost = useShort && !post.endsWith("days ago");

    return [
      isPrePost ? post : undefined,
      loc === "Remote" ? loc : undefined,
      this.#getCompString(),
      exp,
      toWorkTimeBasisLabel(workTimeBasis),
      toJobFamilyLabel(jobFamily),
      loc === "Remote" ? undefined : loc,
      isPrePost ? undefined : post,
    ].filter(Boolean);
  }

  #tsToDaysString(ts: number): string {
    const days = Math.floor((Date.now() - ts) / MS_PER_DAY);
    if (days === 0) return "Just Posted";
    if (days < 7) return "New";
    if (days < 30) return "Recent";
    return `${days} days ago`;
  }

  #getCompString(): string | undefined {
    const { minSalary, payCadence, currency } = this.#job;
    const cadence = toPayCadenceLabel(payCadence) || undefined;

    if (minSalary != null) {
      const noCurrencyPrefix = cadence ? "" : "Pay: ";
      const amount = toCurrencyFormat(minSalary, currency, noCurrencyPrefix);
      return cadence ? `${amount} / ${cadence}` : `${amount}`;
    }

    if (currency && cadence) return `Paid in ${currency} per ${cadence}`;
    if (cadence) return `Paid per ${cadence}`;
    if (currency) return `Paid in ${currency}`;
    return undefined;
  }
}
