import axios, { AxiosResponse } from "axios";
import type { ATS, Company, CompanyKey, Job, JobKey } from "../types/dbModels";
import { AppError } from "../utils/AppError";
import { getSubContext, logError } from "../utils/telemetry";

/**
 * Base class for ATS (Applicant Tracking System) implementations
 * providing common functionality and required interface
 */
export abstract class ATSBase {
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
    const result = await axios.get<T>(`${this.baseUrl}/${id}/${url}`, {
      timeout: 5000,
    });
    const duration = Date.now() - start;

    logAtsCall(`GET ${name}`, this.ats, id, duration, result);

    if (result.status === 404) {
      throw new AppError(`${this.ats} / ${id}: Not Found`, 404);
    }

    if (result.status !== 200) {
      throw new AppError(`${this.ats} / ${id}: Request Failed`, 500);
    }

    return result.data;
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
  { status, statusText }: AxiosResponse
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
