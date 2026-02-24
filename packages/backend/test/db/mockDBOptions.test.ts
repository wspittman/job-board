import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { suite, test } from "node:test";
import { loadMockDBOptions } from "../../src/db/mockDBOptions.ts";

suite("loadMockDBOptions", () => {
  test("returns undefined when no sources are provided", () => {
    assert.equal(loadMockDBOptions({}), undefined);
  });

  test("parses inline JSON", () => {
    const options = loadMockDBOptions({
      mockOptionsJson: '{"company":{"data":[{"id":"acme","ats":"gh"}]}}',
    });

    assert.deepEqual(options, {
      company: { data: [{ id: "acme", ats: "gh" }] },
    });
  });

  test("merges file and inline JSON with inline precedence", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mock-db-options-"));
    const mockPath = path.join(tempDir, "mock-options.json");
    fs.writeFileSync(
      mockPath,
      JSON.stringify({
        company: { data: [{ id: "from-file", ats: "gh" }] },
        job: { data: [{ id: "job-1", companyId: "from-file" }] },
      }),
    );

    const options = loadMockDBOptions({
      mockOptionsPath: mockPath,
      mockOptionsJson: '{"company":{"data":[{"id":"from-inline","ats":"gh"}]}}',
    });

    assert.deepEqual(options, {
      company: { data: [{ id: "from-inline", ats: "gh" }] },
      job: { data: [{ id: "job-1", companyId: "from-file" }] },
    });
  });

  test("throws helpful errors for invalid JSON", () => {
    assert.throws(
      () => loadMockDBOptions({ mockOptionsJson: "{not-valid-json}" }),
      /Invalid Cosmos DB mock options JSON in DATABASE_MOCK_OPTIONS/,
    );
  });

  test("throws when JSON is not an object", () => {
    assert.throws(
      () => loadMockDBOptions({ mockOptionsJson: "[]" }),
      /must be a JSON object keyed by container name/,
    );
  });
});
