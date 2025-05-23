import { readInputNames, readObj } from "./fileUtils";

export async function fillCompanyTests() {
  return fillTests("fillCompany", [
    // Note: equals doesn't currently support values from script
    {
      type: "contains",
      transform: "output.website",
      value: "file://../testGenerator.ts:assertWebsite",
    },
    {
      type: "contains",
      transform: "output.industry",
      value: "file://../testGenerator.ts:assertIndustry",
    },
  ]);
}

async function fillTests(action: string, asserts: Record<string, unknown>[]) {
  const fileNames = await readInputNames(action);

  return [
    {
      vars: { inputFile: fileNames.slice(1, 2) },
      assert: asserts,
    },
  ];
}

export const assertWebsite = (_, context: AssertContext) =>
  getGroundTruth(context, "website");

export const assertIndustry = (_, context: AssertContext) =>
  getGroundTruth(context, "industry");

async function getGroundTruth(
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
