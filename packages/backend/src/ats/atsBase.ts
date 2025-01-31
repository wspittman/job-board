import axios, { AxiosResponse } from "axios";
import https from "https";
import type { ATS, Company, CompanyKey, Job, JobKey } from "../types/dbModels";
import { AppError } from "../utils/AppError";
import { getSubContext, logError } from "../utils/telemetry";

/**
 * Base class for ATS (Applicant Tracking System) implementations
 * providing common functionality and required interface
 */
export abstract class ATSBase {
  private agent = new https.Agent({ keepAlive: true });

  constructor(protected ats: ATS, protected baseUrl: string) {}

  /**
   * Retrieves company information from the ATS
   */
  abstract getCompany(key: CompanyKey): Promise<Company>;

  /**
   * Fetches jobs for a company from the ATS
   * @param full - Whether to fetch full job details
   */
  abstract getJobs(key: CompanyKey, full?: boolean): Promise<Job[]>;

  /**
   * Retrieves detailed information for a specific job
   */
  abstract getJob(key: CompanyKey, jobKey: JobKey): Promise<Job>;

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

interface AtsLog {
  name: string;
  ats: string;
  id: string;
  ms: number;
  status?: number;
  statusText?: string;
}

const initialContext = () => ({
  calls: [] as AtsLog[],
  count: 0,
  ms: 0,
});

function logAtsCall(
  name: string,
  ats: ATS,
  id: string,
  ms: number,
  { status, statusText }: Pick<AxiosResponse, "status" | "statusText">
) {
  try {
    const log: AtsLog = {
      name,
      ats,
      id,
      ms,
    };

    if (status !== 200) {
      log.status = status;
      log.statusText = statusText;
    }

    addAtsLog(log);
  } catch (error) {
    logError(error);
  }
}

function addAtsLog(log: AtsLog) {
  const context = getSubContext("ats", initialContext);

  if (context.calls.length < 100) {
    context.calls.push(log);
  }

  context.count++;
  context.ms += log.ms;
}

// #endregion
