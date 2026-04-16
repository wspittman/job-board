import { logger } from "dry-utils-logger";
import { apiFetch } from "../core/http.ts";
import { enforceMutationSafety } from "../core/safety.ts";
import { requireAts, requireIds } from "../shared/validators.ts";
import { type CommandContext, type CommandDef } from "../shared/types.ts";

function getEnv(flags: Record<string, string | boolean>): "prod" | "local" {
  return flags.env === "prod" ? "prod" : "local";
}

async function runMutation(
  ctx: CommandContext,
  fn: (env: "prod" | "local") => Promise<unknown>,
): Promise<void> {
  enforceMutationSafety(ctx.flags);
  const env = getEnv(ctx.flags);
  logger.info(`Executing ${ctx.commandName} in ${env}`);
  const result = await fn(env);
  logger.info("Success", result);
}

export const apiCommands: Record<string, CommandDef> = {
  "api:add-companies": {
    usage: () =>
      "<ats> <companyId...> [--env local|prod] [--apply] [--yes-prod]",
    description: "Import one or more companies from an ATS into the backend.",
    mutateApi: true,
    run: async (ctx) => {
      const [atsArg, ...companyArgList] = ctx.args;
      const ats = requireAts(atsArg);
      const companyIds = requireIds("COMPANY_ID", companyArgList);
      await runMutation(ctx, async (env) => {
        const body = { ats, ids: companyIds };
        return await apiFetch("PUT", "companies", { body, env });
      });
    },
  },
  "api:ignore-job": {
    usage: () =>
      "<ats> <companyId> <jobId> [--env local|prod] [--apply] [--yes-prod]",
    description: "Mark a job as ignored so future syncs do not restore it.",
    mutateApi: true,
    run: async (ctx) => {
      const [atsArg, companyId, jobId] = ctx.args;
      const ats = requireAts(atsArg);
      const [vCompanyId] = requireIds("COMPANY_ID", [companyId ?? ""]);
      const [vJobId] = requireIds("JOB_ID", [jobId ?? ""]);
      await runMutation(ctx, async (env) => {
        const body = { ats, companyId: vCompanyId, jobId: vJobId };
        return await apiFetch("DELETE", "company/job", { body, env });
      });
    },
  },
  "api:delete-company": {
    usage: () => "<ats> <companyId> [--env local|prod] [--apply] [--yes-prod]",
    description: "Delete a company from the backend index.",
    mutateApi: true,
    run: async (ctx) => {
      const [atsArg, companyId] = ctx.args;
      const ats = requireAts(atsArg);
      const [vCompanyId] = requireIds("COMPANY_ID", [companyId ?? ""]);
      await runMutation(ctx, async (env) => {
        const body = { ats, id: vCompanyId };
        return await apiFetch("DELETE", "company", { body, env });
      });
    },
  },
  "api:sync-company-jobs": {
    usage: () => "<ats> <companyId> [--env local|prod] [--apply] [--yes-prod]",
    description: "Refresh jobs for one company from ATS.",
    mutateApi: true,
    run: async (ctx) => {
      const [atsArg, companyId] = ctx.args;
      const ats = requireAts(atsArg);
      const [vCompanyId] = requireIds("COMPANY_ID", [companyId ?? ""]);
      await runMutation(ctx, async (env) => {
        const body = { ats, id: vCompanyId };
        return await apiFetch("POST", "company/jobs/sync", { body, env });
      });
    },
  },
  "api:e2e": {
    usage: () => "smoke [--env local|prod] [--apply] [--yes-prod]",
    description: "Run a lightweight end-to-end API workflow.",
    mutateApi: true,
    run: async (ctx) => {
      const [flow] = ctx.args;
      if (flow !== "smoke") {
        throw new Error(`Unsupported e2e flow: ${flow ?? ""}`);
      }

      await runMutation(ctx, async (env) => {
        return await apiFetch("GET", "health", { env });
      });
    },
  },
};
