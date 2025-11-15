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

    const postDays = Math.floor((Date.now() - postTS) / MS_PER_DAY);
    const recent = postDays < 7 ? "New" : "Recent";

    return {
      title,
      company: companyFriendly ?? company,
      summary,
      recent: postDays < 30 ? recent : undefined,
      location: isRemote ? "Remote" : location,
      salary: salary ? `$${salary.toLocaleString()}` : undefined,
      experience: experience != null ? `${experience} yrs exp` : undefined,
      postDays: `${postDays} days ago`,
      postDate: new Date(postTS).toLocaleDateString(),
    };
  }
}
