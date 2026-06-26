import type {
  ATS,
  Company,
  CompanyKey,
  Job,
  JobKey,
} from "../models/models.ts";
import { createSubscribeAggregator, logError } from "../telemetry/telemetry.ts";
import type { Bag, Context } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";

type StatusResponse = { status: number; statusText: string };

export abstract class ATSInterface {
  /** Get company information from the ATS */
  abstract getCompany(key: CompanyKey): Promise<Company>;

  /**
   * Get all of a company's jobs from the ATS.
   * @param meta If true and the ATS supports it, only fetch metadata (no context, item valid but not fully defined)
   */
  abstract getJobs(key: CompanyKey, meta?: boolean): Promise<Context<Job>[]>;

  /** Get detailed information for an example job */
  abstract getExampleJob(key: CompanyKey): Promise<Context<Job> | undefined>;

  /** Get detailed information for a specific job */
  abstract getSpecificJob(
    jobKey: JobKey,
    key: CompanyKey,
  ): Promise<Context<Job>>;
}

/**
 * Base class for ATS (Applicant Tracking System) implementations
 * providing common functionality and required interface
 */
export abstract class ATSBase extends ATSInterface {
  readonly #ats: ATS;
  readonly #baseUrl: string;

  constructor(ats: ATS, baseUrl: string) {
    super();
    this.#ats = ats;
    this.#baseUrl = baseUrl;
  }

  /**
   * Makes an HTTP GET request to the ATS API
   * @param name Name of the operation for logging
   * @param id Company identifier
   * @param url API endpoint URL
   * @returns API response data
   * @throws AppError for 404 or other error responses
   */
  protected async httpCall<T>(
    name: string,
    id: string,
    url: string,
  ): Promise<T> {
    const start = Date.now();
    let logStatus: StatusResponse;
    let bytes = -1;

    try {
      const response = await fetch(`${this.#baseUrl}/${id}/${url}`, {
        signal: AbortSignal.timeout(15_000),
      });

      const { status, statusText, ok } = response;
      logStatus = { status, statusText };
      bytes = await this.#getContentLength(response);

      if (!ok) {
        if (status === 404) {
          throw new AppError(`${this.#ats} / ${id}: Not Found`, 404);
        }

        throw new AppError(`${this.#ats} / ${id}: Request Failed`, 500);
      }

      return (await response.json()) as T;
    } catch (error) {
      logStatus = this.#errorToStatus(error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(`${this.#ats} / ${id}: Request Failed`, 500, error);
    } finally {
      const duration = Date.now() - start;
      logStatus ??= {
        status: 500,
        statusText: "Request Exception",
      };
      logAtsCall(`GET ${name}`, this.#ats, id, duration, bytes, logStatus);
    }
  }

  async #getContentLength(res: Response) {
    try {
      // The easy way if the server supports it
      const cl = res.headers.get("content-length");
      if (cl != null) return Number(cl);

      // The more annoying way
      const buf = await res.clone().arrayBuffer();
      return buf.byteLength;
    } catch (error) {
      // Length is only for telemetry, so just log and move on.
      logError(error);
      return -1;
    }
  }

  #errorToStatus(error: unknown): StatusResponse {
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
  bytes: number,
  { status, statusText }: StatusResponse,
) {
  try {
    const log: Bag = { name, ats, id, ms, bytes };

    if (status !== 200) {
      log["status"] = status;
      log["statusText"] = statusText;
    }

    subscribeAggregator({
      tag: `${ats} ${name}`,
      dense: log,
      metrics: { ms, bytes },
      blob: {},
    });
  } catch (error) {
    logError(error);
  }
}

// #endregion
