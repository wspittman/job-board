import { logError, logProperty } from "./telemetry";

export async function asyncBatch<T>(
  name: string,
  values: T[],
  fn: (value: T) => Promise<void>,
  size = 5
) {
  if (!values.length) return;

  logProperty(`Batch_${name}`, values.length);

  for (let i = 0; i < values.length; i += size) {
    const batch = values.slice(i, i + size);
    const result = await Promise.allSettled(batch.map((value) => fn(value)));

    result.forEach((r, index) => {
      if (r.status === "rejected") {
        logError(`Batch_${name}: at values[${i + index}]: ${r.reason}`);
      }
    });
  }
}
