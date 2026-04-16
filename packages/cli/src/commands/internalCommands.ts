import { logger } from "dry-utils-logger";
import { markdownToHtml } from "dry-utils-text";
import {
  fetchSample,
  fetchJobCount,
  getLLMOptions,
  runLlmAction,
} from "../internal/backend.ts";
import { readJson, readText, writeJson, writeText } from "../io/files.ts";
import { computeKMeans, cosineDistanceAll, truncate } from "../eval/math.ts";
import {
  requireAts,
  requireDataModel,
  requireIds,
  requireLlmAction,
} from "../shared/validators.ts";
import { CommandError, type CommandDef } from "../shared/types.ts";

interface PlaygroundInput {
  train: string[];
  testPos: string[];
  testNeg: string[];
}

export const internalCommands: Record<string, CommandDef> = {
  "internal:fetch-input": {
    usage: () => "<dataModel> <ats> <companyId> [jobId]",
    description: "Fetch one input payload for internal workflows.",
    run: async ({ args }) => {
      const [dataModelArg, atsArg, companyId, jobId] = args;
      const dataModel = requireDataModel(dataModelArg);
      const ats = requireAts(atsArg);
      const [vCompanyId] = requireIds("COMPANY_ID", [companyId ?? ""]);
      const value = await fetchSample(dataModel, ats, vCompanyId, jobId);
      const suffix = dataModel === "job" ? `_${jobId ?? "auto"}` : "";
      const file = `${dataModel}_${ats}_${vCompanyId}${suffix}`;
      const filePath = await writeJson(value, {
        area: "eval",
        stage: "in",
        file,
      });
      logger.info(`Wrote ${filePath}`);
    },
  },
  "internal:fetch-input-many": {
    usage: () => "<dataModel> <ats> <companyId[, ...]>",
    description: "Fetch input payloads for many companies.",
    run: async ({ args }) => {
      const [dataModelArg, atsArg, ...companyArgs] = args;
      const dataModel = requireDataModel(dataModelArg);
      const ats = requireAts(atsArg);
      const companyIds = requireIds("COMPANY_ID", companyArgs);
      for (const companyId of companyIds) {
        const value = await fetchSample(dataModel, ats, companyId);
        const filePath = await writeJson(value, {
          area: "eval",
          stage: "in",
          file: `${dataModel}_${ats}_${companyId}`,
        });
        logger.info(`Wrote ${filePath}`);
      }
    },
  },
  "internal:job-counts": {
    usage: () => "<ats> <companyId[, ...]>",
    description: "Collect job counts for one or more companies.",
    run: async ({ args }) => {
      const [atsArg, ...companyArgs] = args;
      const ats = requireAts(atsArg);
      const companyIds = requireIds("COMPANY_ID", companyArgs);
      const counts: Record<string, number | string> = {};
      for (const companyId of companyIds) {
        try {
          counts[companyId] = await fetchJobCount(ats, companyId);
        } catch (error) {
          counts[companyId] =
            error instanceof Error ? error.message : String(error);
        }
      }
      const filePath = await writeJson(
        { ats, counts, timestamp: new Date().toISOString() },
        { area: "jobCounts", stage: "out", file: `${ats}_${Date.now()}` },
      );
      logger.info(`Wrote ${filePath}`);
    },
  },
  "internal:eval": {
    usage: () => "<llmAction> [runName]",
    description: "Run one LLM action against every eval input sample.",
    run: async ({ args }) => {
      const [llmActionArg, runName = `run_${Date.now()}`] = args;
      const llmAction = requireLlmAction(llmActionArg);
      const llmOpts = getLLMOptions(llmAction);
      const input = await readJson<Record<string, unknown>>({
        area: "eval",
        stage: "in",
        file: llmAction,
      });

      if (!input) {
        throw new CommandError(
          `No eval input found for ${llmAction}. Expected file in data/eval/in/${llmAction}.json`,
        );
      }

      const payload =
        llmAction === "fillCompanyInfo" || llmAction === "fillJobInfo"
          ? input
          : typeof input.prompt === "string"
            ? input.prompt
            : "";

      const outcome = await runLlmAction(llmAction, payload);
      const filePath = await writeJson(
        {
          llmAction,
          runName,
          model: llmOpts.model,
          reasoningEffort: llmOpts.reasoningEffort,
          evalTS: new Date().toISOString(),
          outcome,
        },
        { area: "eval", stage: "out", file: `${llmAction}_${runName}` },
      );
      logger.info(`Wrote ${filePath}`);
    },
  },
  "internal:blog-build": {
    usage: () => "<postName>",
    description: "Convert markdown blog input into HTML output.",
    run: async ({ args }) => {
      const [postName = ""] = args;
      if (!postName || postName.match(/[^a-zA-Z0-9_-]/)) {
        throw new CommandError("Invalid POST_NAME.");
      }
      const text = await readText({
        area: "blog",
        stage: "in",
        file: postName,
      });
      if (!text) {
        throw new CommandError(
          `File not found for blog input: ${postName}.txt`,
        );
      }
      const html = markdownToHtml(text);
      const outputPath = await writeText(html, {
        area: "blog",
        stage: "out",
        file: postName,
      });
      logger.info(`Wrote ${outputPath}`);
    },
  },
  "internal:playground": {
    usage: () => "(no arguments)",
    description: "Run clustering diagnostics on playground vectors.",
    run: async () => {
      const input = await readJson<PlaygroundInput>({
        area: "playground",
        stage: "in",
        file: "general_interest",
      });

      if (
        !input?.train?.length ||
        !input.testPos?.length ||
        !input.testNeg?.length
      ) {
        throw new CommandError(
          "Invalid playground input. Expected train/testPos/testNeg arrays.",
        );
      }

      const { clusters, centroids } = computeKMeans(input.train, 5);
      const report = {
        trainSize: input.train.length,
        posSize: input.testPos.length,
        negSize: input.testNeg.length,
        clusters,
        centroidMagnitudes: centroids.map((vec) =>
          truncate(Math.sqrt(vec.reduce((sum, n) => sum + n * n, 0))),
        ),
        posDistances: cosineDistanceAll(centroids[0] ?? [0], centroids),
      };

      const filePath = await writeJson(report, {
        area: "playground",
        stage: "out",
        file: `summary_${Date.now()}`,
      });
      logger.info(`Wrote ${filePath}`);
    },
  },
};
