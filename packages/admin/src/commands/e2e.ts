import { fetcher } from "../fetcher.ts";
import type { HttpMethod } from "../types.ts";

/**
 * Defines a single step in an end-to-end flow.
 */
interface Step {
  method: HttpMethod;
  path: string;
  body?: unknown;
  asAdmin?: boolean;
  expectStatus?: number;
}

const flows: Record<string, Step[]> = {
  smoke: [
    {
      method: "GET",
      path: "metadata",
      asAdmin: false,
    },
    {
      method: "GET",
      path: "jobs",
      asAdmin: false,
    },
  ],
};

export const FLOW_NAMES = Object.keys(flows);

/**
 * Execute the named flow against the configured backend API.
 * @param name - Flow identifier to execute.
 */
export async function runFlow(name: string): Promise<void> {
  const flow = flows[name];

  if (!flow) {
    throw new Error(`Unknown flow "${name}".`);
  }

  console.log(`Running flow "${name}"`);

  for (const [
    index,
    { method, path, expectStatus = 200, ...opts },
  ] of flow.entries()) {
    const step = index + 1;

    console.log(`[${step}/${flow.length}] ${method} ${path}`);

    const result = await fetcher(method, path, {
      ...opts,
      env: "local",
      throwOnError: false,
    });

    console.log(`  Status: ${result.status}`);

    if (result.status !== expectStatus) {
      console.error(`FAIL: Step ${step} expected status ${expectStatus}`);
      console.dir(result, { depth: null });
      return;
    }
  }

  console.log(`Flow "${name}" completed successfully.`);
}
