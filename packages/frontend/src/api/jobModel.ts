import { api, API_URL } from "./api";
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

  async getDisplayStrings() {
    const { title, company, isRemote, location, postTS, facets } = this.#job;
    const { salary, experience, summary } = facets ?? {};
    const companyFriendly = await metadataModel.getCompanyFriendlyName(company);

    const locBreak = location.lastIndexOf(",");
    const locationShort =
      locBreak === -1 ? location : location.slice(0, locBreak);

    return {
      title,
      company: companyFriendly ?? company,
      summary,
      location: isRemote ? "Remote" : location,
      locationShort: isRemote ? "Remote" : locationShort,
      salary: salary ? `$${salary.toLocaleString()}` : undefined,
      experience: experience != null ? `${experience} yrs exp` : undefined,
      postDays: this.tsToDaysString(postTS),
      postDate: new Date(postTS).toLocaleDateString(),
    };
  }

  tsToDaysString(ts: number): string {
    const days = Math.floor((Date.now() - ts) / MS_PER_DAY);
    if (days === 0) return "Just Posted";
    if (days < 7) return "New";
    if (days < 30) return "Recent";
    return `${days} days ago`;
  }
}
