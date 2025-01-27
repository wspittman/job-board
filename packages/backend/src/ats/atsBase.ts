import axios, { AxiosResponse } from "axios";
import type { ATS, Company, CompanyKey, Job, JobKey } from "../types/dbModels";
import { AppError } from "../utils/AppError";
import { getSubContext, logError } from "../utils/telemetry";

export abstract class ATSBase {
  constructor(protected ats: ATS, protected baseUrl: string) {}

  abstract getCompany(key: CompanyKey): Promise<Company>;
  abstract getJobs(key: CompanyKey, full?: boolean): Promise<Job[]>;
  abstract getJob(key: CompanyKey, jobKey: JobKey): Promise<Job>;

  protected async axiosCall<T>(
    name: string,
    id: string,
    url: string
  ): Promise<T> {
    const start = Date.now();
    const result = await axios.get<T>(`${this.baseUrl}/${id}/${url}`);
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
