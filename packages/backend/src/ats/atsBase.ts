import type {
  ATS,
  Company,
  CompanyKey,
  Job,
  JobKey,
} from "../models/models.ts";
import type { Bag, Context } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";
import { createSubscribeAggregator, logError } from "../utils/telemetry.ts";

/**
 * Base class for ATS (Applicant Tracking System) implementations
 * providing common functionality and required interface
 */
type StatusResponse = { status: number; statusText: string };

export abstract class ATSBase {
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
  protected async httpCall<T>(
    name: string,
    id: string,
    url: string
  ): Promise<T> {
    const start = Date.now();
    let logStatus: StatusResponse = {
      status: 500,
      statusText: "Request Exception",
    };

    try {
      const response = await fetch(`${this.baseUrl}/${id}/${url}`, {
        signal: AbortSignal.timeout(10_000),
      });

      logStatus = {
        status: response.status,
        statusText: response.statusText,
      };

      if (!response.ok) {
        if (response.status === 404) {
          throw new AppError(`${this.ats} / ${id}: Not Found`, 404);
        }

        throw new AppError(`${this.ats} / ${id}: Request Failed`, 500);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof AppError) {
        if (logStatus.statusText === "Request Exception") {
          logStatus = this.errorToStatus(error);
        }
        throw error;
      }

      logStatus = this.errorToStatus(error);
      throw new AppError(`${this.ats} / ${id}: Request Failed`, 500, error);
    } finally {
      const duration = Date.now() - start;
      logAtsCall(`GET ${name}`, this.ats, id, duration, logStatus);
    }
  }

  private errorToStatus(error: unknown): StatusResponse {
    if (error instanceof AppError) {
      return { status: error.statusCode, statusText: error.message };
    }

    if (error instanceof Error) {
      return { status: -1, statusText: error.message };
    }

    return { status: -1, statusText: String(error) };
  }
}

// #region Telemetry

const subscribeAggregator = createSubscribeAggregator("ats", 100);

function logAtsCall(
  name: string,
  ats: ATS,
  id: string,
  ms: number,
  { status, statusText }: StatusResponse
) {
  try {
    const log: Bag = { name, ats, id, ms };

    if (status !== 200) {
      log["status"] = status;
      log["statusText"] = statusText;
    }

    subscribeAggregator({
      tag: `${ats} ${name}`,
      dense: log,
      metrics: { ms },
      blob: {},
    });
  } catch (error) {
    logError(error);
  }
}

// #endregion
