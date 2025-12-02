import { api, API_URL } from "./api";
import { toJobFamilyLabel, toWorkTimeBasisLabel } from "./apiEnums";
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

  async getDisplayDetail() {
    const { title, company, facets } = this.#job;
    const { summary } = facets ?? {};
    const companyFriendly = await metadataModel.getCompanyFriendlyName(company);

    return {
      title,
      company: companyFriendly ?? company,
      summary,
    };
  }

  async getDisplayFacets(useShort = false) {
    const { isRemote, location, postTS, facets, workTimeBasis, jobFamily } =
      this.#job;
    const { salary, experience } = facets ?? {};

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

    return {
      location: loc,
      salary: salary ? `$${salary.toLocaleString()}` : undefined,
      experience: exp,
      post,
      workTimeBasis: toWorkTimeBasisLabel(workTimeBasis),
      jobFamily: toJobFamilyLabel(jobFamily),
    };
  }

  #tsToDaysString(ts: number): string {
    const days = Math.floor((Date.now() - ts) / MS_PER_DAY);
    if (days === 0) return "Just Posted";
    if (days < 7) return "New";
    if (days < 30) return "Recent";
    return `${days} days ago`;
  }
}
