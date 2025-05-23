import { readObj } from "./fileUtils";

// Note: equals doesn't currently support values from script
export const assertEquals = assertContains;

export function assertContains(key: string) {
  return {
    type: "contains",
    transform: `output.${key}`,
    value: `file://../assert.ts:${key}`,
  };
}

export const website = createFunction("website");
export const industry = createFunction("industry");
export const foundingYear = createFunction("foundingYear");
export const size = createFunction("size");
export const stage = createFunction("stage");
export const visa = createFunction("visa");

function createFunction(key: string) {
  return (_, context: AssertContext) => getGround(context, key);
}

async function getGround(
  { prompt, vars }: AssertContext,
  key: string
): Promise<string> {
  const inputFile = vars.inputFile as string;

  const groundTruth = await readObj<ProviderResponse>(
    prompt,
    "Ground",
    inputFile
  );

  if (!groundTruth) {
    throw new Error(`Ground truth not found for ${inputFile}`);
  }

  return groundTruth.output[key];
}
