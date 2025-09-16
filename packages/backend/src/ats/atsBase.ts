import axios, { type AxiosResponse } from "axios";
import https from "https";
import type {
  ATS,
  Company,
  CompanyKey,
  Job,
  JobKey,
} from "../types/dbModels.ts";
import type { Context } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";
import { createSubscribeAggregator, logError } from "../utils/telemetry.ts";

/**
 * Base class for ATS (Applicant Tracking System) implementations
 * providing common functionality and required interface
 */
export abstract class ATSBase {
  private agent = new https.Agent({ keepAlive: true });
  protected ats: ATS;
  protected baseUrl: string;

  constructor(ats: ATS, baseUrl: string) {
    this.ats = ats;
    this.baseUrl = baseUrl;
  }

  /**
   * Retrieves company information from the ATS
   * @param full - Whether to fetch full job details
   */
  abstract getCompany(
    key: CompanyKey,
    full?: boolean
  ): Promise<Context<Company>>;

  /**
   * Fetches jobs for a company from the ATS
   * @param full - Whether to fetch full job details
   */
  abstract getJobs(key: CompanyKey, full?: boolean): Promise<Context<Job>[]>;

  /**
   * Retrieves detailed information for a specific job
   */
  abstract getJob(jobKey: JobKey): Promise<Context<Job>>;

  /**
   * Makes an HTTP GET request to the ATS API
   * @param name - Name of the operation for logging
   * @param id - Company identifier
   * @param url - API endpoint URL
   * @returns API response data
   * @throws AppError for 404 or other error responses
   */
  protected async axiosCall<T>(
    name: string,
    id: string,
    url: string
  ): Promise<T> {
    const start = Date.now();
    let logStatus = { status: 500, statusText: "Request Exception" };

    try {
      const result = await axios.get<T>(`${this.baseUrl}/${id}/${url}`, {
        httpsAgent: this.agent,
        timeout: 10000,
      });
      logStatus = result;
      return result.data;
    } catch (error) {
      logStatus = this.errorToStatus(error);
      if (logStatus.status === 404) {
        throw new AppError(`${this.ats} / ${id}: Not Found`, 404, error);
      }
      throw new AppError(`${this.ats} / ${id}: Request Failed`, 500, error);
    } finally {
      const duration = Date.now() - start;
      logAtsCall(`GET ${name}`, this.ats, id, duration, logStatus);
    }
  }

  private errorToStatus(error: unknown) {
    if (axios.isAxiosError(error)) {
      return (
        error.response ?? {
          status: 500,
          statusText: error.message,
        }
      );
    } else if (error instanceof Error) {
      return { status: -1, statusText: error.message };
    } else {
      return { status: -1, statusText: String(error) };
    }
  }
}

// #region Telemetry

const subscribeAggregator = createSubscribeAggregator("ats", 100);

function logAtsCall(
  name: string,
  ats: ATS,
  id: string,
  ms: number,
  { status, statusText }: Pick<AxiosResponse, "status" | "statusText">
) {
  try {
    const log: Record<string, unknown> = { name, ats, id, ms };

    if (status !== 200) {
      log["status"] = status;
      log["statusText"] = statusText;
    }

    subscribeAggregator({
      tag: `${ats} ${name}`,
      dense: log,
      metrics: { ms },
    });
  } catch (error) {
    logError(error);
  }
}

// #endregion
