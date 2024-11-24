import axios, { AxiosResponse } from "axios";
import { AppError } from "../AppError";
import type { ATS, Company } from "../db/models";
import { getRequestContext } from "../utils/telemetry";
import { Greenhouse } from "./greenhouse";
import { Lever } from "./lever";
import type { AtsEndpoint, JobUpdates } from "./types";

const atsEndpoints: Record<ATS, AtsEndpoint> = {
  greenhouse: new Greenhouse(),
  lever: new Lever(),
};

export function getAtsList(): ATS[] {
  return Object.keys(atsEndpoints) as ATS[];
}

export async function getAtsCompany(
  atsName: ATS,
  id: string
): Promise<Company> {
  const ats = atsEndpoints[atsName];
  const url = ats.getCompanyEndpoint(id);
  const response = await axiosCall("GET Company", atsName, id, url);
  return ats.formatCompany(id, response);
}

export async function getAtsJobs(
  company: Company,
  currentIds: string[]
): Promise<JobUpdates> {
  const ats = atsEndpoints[company.ats];
  const url = ats.getJobsEndpoint(company.id);
  const response = await axiosCall("GET Jobs", company.ats, company.id, url);

  const {
    added: addedRaw,
    removed,
    existing,
  } = splitJobs(ats, response, currentIds);

  const added = ats.formatJobs(company, addedRaw);

  return { added, removed, kept: existing };
}

async function axiosCall(
  name: string,
  ats: ATS,
  id: string,
  url: string
): Promise<unknown> {
  const start = Date.now();
  const result = await axios.get(url);
  const duration = Date.now() - start;

  logAtsCall(name, ats, id, duration, result);

  if (result.status === 404) {
    throw new AppError(`${ats} / ${id}: Not Found`, 404);
  }

  if (result.status !== 200) {
    throw new AppError(`${ats} / ${id}: Request Failed`, 500);
  }

  return result.data;
}

function splitJobs(
  ats: AtsEndpoint,
  rawJobData: unknown,
  currentIds: string[]
) {
  const rawJobs = ats.getRawJobs(rawJobData);

  const jobIdSet = new Set(rawJobs.map(([id]) => id));
  const currentIdSet = new Set(currentIds);

  // Any ATS job not in the current set needs to be added
  const added = rawJobs
    .filter(([id]) => !currentIdSet.has(id))
    .map(([_, job]) => job);

  // Any jobs in the current set but not in the ATS need to be deleted
  const removed = currentIds.filter((id) => !jobIdSet.has(id));

  // If job is in both ATS and DB, do nothing but keep a count
  const existing = jobIdSet.size - added.length;

  return { added, removed, existing };
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

interface AtsContext {
  calls: AtsLog[];
  count: number;
  ms: number;
}

function logAtsCall(
  name: string,
  ats: ATS,
  id: string,
  ms: number,
  { status, statusText }: AxiosResponse
) {
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
}

function addAtsLog(log: AtsLog) {
  const context = getAtsContext();

  if (context.calls.length < 100) {
    context.calls.push(log);
  }

  context.count++;
  context.ms += log.ms;
}

function getAtsContext(): AtsContext {
  const context = getRequestContext();
  context.ats ??= <AtsContext>{
    calls: [],
    count: 0,
    ms: 0,
  };
  return <AtsContext>context.ats;
}

// #endregion
