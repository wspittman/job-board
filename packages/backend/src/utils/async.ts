import { getSubContext, logError } from "./telemetry";

export interface BatchOptions {
  batchId?: string;
  logPath?: string[];
  size?: number;
}

export async function batchRun<T>(
  values: T[],
  func: (value: T, logPath: string[]) => Promise<void>,
  batchName: string,
  { batchId, logPath, size = 5 }: BatchOptions = {}
) {
  if (!values.length) return;

  const path = logBatchAction(logPath, batchId, batchName, values.length);

  for (let i = 0; i < values.length; i += size) {
    const batch = values.slice(i, i + size);
    const result = await Promise.allSettled(
      batch.map((value) => func(value, path))
    );

    result.forEach((r, index) => {
      if (r.status === "rejected") {
        logError(`${path.join("/")}: at values[${i + index}]: ${r.reason}`);
      }
    });
  }
}

export function batchLog(
  logName: string,
  value: unknown,
  { batchId, logPath }: BatchOptions = {}
) {
  logBatchAction(logPath, batchId, logName, value);
}

// #region Telemetry

interface BatchContext {
  [key: string]: number | BatchContext;
}

function logBatchAction(
  logPath: string[] = [],
  batchId: string = "Batch",
  batchName: string,
  value: unknown
) {
  const tag = `${batchId}_${batchName}`;

  try {
    const context = pathToContext(logPath);
    context[tag] = value;
  } catch (error) {
    logError(error);
  }

  return [...logPath, tag];
}

function pathToContext(logPath: string[]) {
  const context = getSubContext<Record<string, unknown>>("batch", {});

  let current = context;
  for (let key of logPath) {
    if (current[key] == undefined) {
      current[key] = {};
    } else if (typeof current[key] === "number") {
      current[key] = { count: current[key] };
    } else if (typeof current[key] !== "object") {
      current[key] = { value: current[key] };
    }

    current = current[key] as Record<string, unknown>;
  }

  return current;
}

// #endregion
