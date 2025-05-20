import { readInputNames } from "./fileUtils";

export async function fillCompanyTests() {
  return fillTests("fillCompany", [
    {
      type: "contains",
      transform: "output.industry",
      value: "Professional",
    },
  ]);
}

async function fillTests(action: string, asserts: Record<string, unknown>[]) {
  const fileNames = await readInputNames(action);

  return [
    {
      vars: { inputFile: fileNames },
      assert: asserts,
    },
  ];
}
