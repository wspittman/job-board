import { assertEquals, assertSimilar } from "./assert";
import { readInputNames } from "./fileUtils";

export async function fillCompanyTests() {
  return fillTests("fillCompany", [
    assertEquals("website"),
    assertEquals("industry"),
    assertEquals("foundingYear"),
    assertEquals("size"),
    assertEquals("stage"),
    assertEquals("visa"),
    assertSimilar("description"),
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
