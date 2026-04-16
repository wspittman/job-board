import { logger } from "dry-utils-logger";
import { CommandError } from "../types.ts";
import { asArray } from "../utils/utils.ts";
import { request } from "./client.ts";
import { enforceMutationSafety, requireAts, requireIds } from "./guards.ts";
import { runE2E } from "./e2e/run.ts";
import type { ApiCommand, ApiCommandContext } from "./types.ts";

const addCompanies: ApiCommand = {
  usage: () => "<ATS> <COMPANY_ID> [...COMPANY_ID]",
  run: async ([atsArg, ...companyIds], context) => {
    enforceMutationSafety(context.runtime);

    const ats = requireAts(atsArg);
    const ids = requireIds("COMPANY_ID", ...companyIds);
    const result = await request("PUT", "companies", context.runtime.profile, {
      body: { ats, ids },
    });

    logger.info("Success", result);
  },
};

const deleteCompany: ApiCommand = {
  usage: () => "<ATS> <COMPANY_ID>",
  run: async ([atsArg, companyId], context) => {
    enforceMutationSafety(context.runtime);

    const ats = requireAts(atsArg);
    const [id] = requireIds("COMPANY_ID", companyId);
    const result = await request("DELETE", "company", context.runtime.profile, {
      body: { ats, id },
    });

    logger.info("Success", result);
  },
};

const syncCompanyJobs: ApiCommand = {
  usage: () => "<ATS> <COMPANY_ID>",
  run: async ([atsArg, companyId], context) => {
    enforceMutationSafety(context.runtime);

    const ats = requireAts(atsArg);
    const [id] = requireIds("COMPANY_ID", companyId);

    const result = await request(
      "POST",
      "company/jobs/sync",
      context.runtime.profile,
      {
        body: { ats, id },
      },
    );

    logger.info("Success", result);
  },
};

const ignoreJob: ApiCommand = {
  usage: () => "<ATS> <COMPANY_ID> <JOB_ID>",
  run: async ([atsArg, companyId, jobId], context) => {
    enforceMutationSafety(context.runtime);

    const ats = requireAts(atsArg);
    const [id] = requireIds("COMPANY_ID", companyId);
    const [job] = requireIds("JOB_ID", jobId);

    const result = await request(
      "DELETE",
      "company/job",
      context.runtime.profile,
      {
        body: { ats, companyId: id, jobId: job },
      },
    );

    logger.info("Success", result);
  },
};

const listJobs: ApiCommand = {
  usage: () => "[COMPANY_ID]",
  run: async ([companyId], context) => {
    const query = companyId ? { companyId } : undefined;
    const result = await request("GET", "jobs", context.runtime.profile, {
      asAdmin: false,
      query,
    });

    logger.info("Success", result);
  },
};

const registry: Record<string, ApiCommand> = {
  "api:add-companies": addCompanies,
  "api:delete-company": deleteCompany,
  "api:sync-company-jobs": syncCompanyJobs,
  "api:ignore-job": ignoreJob,
  "api:list-jobs": listJobs,
  "api:e2e": runE2E,
};

export async function runApiCommand(
  name: string,
  args: string[],
  context: ApiCommandContext,
): Promise<boolean> {
  const command = registry[name];

  if (!command) {
    return false;
  }

  await command.run(args, context);
  return true;
}

export function getApiUsage(indent = ""): string[] {
  return Object.entries(registry).flatMap(([name, command]) =>
    asArray(command.usage()).map(
      (line, index) =>
        `${index === 0 ? `${indent}${name} ` : `${indent}${" ".repeat(name.length + 1)}`}${line}`,
    ),
  );
}

export function assertApiCommandKnown(name: string): void {
  if (!registry[name]) {
    throw new CommandError(`Invalid Command "${name}"`);
  }
}
