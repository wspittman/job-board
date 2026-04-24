import assert from "node:assert/strict";
import { after, suite, test } from "node:test";
import { CommandError } from "../../src/types.ts";
import { validateCompanyArgs, validateJobArgs } from "../../src/utils/utils.ts";
import { afterReset } from "../setup.ts";

after(afterReset);

suite("utils arg validators", () => {
  test("validateCompanyArgs parses ats and company ids", () => {
    assert.deepEqual(validateCompanyArgs(["GREENHOUSE", " abc ", "d,ef", ""]), {
      ats: "greenhouse",
      companyId: "abc",
      companyIds: ["abc", "def"],
    });
  });

  test("validateCompanyArgs throws for invalid ats", () => {
    assert.throws(() => validateCompanyArgs(["unknown", "abc"]), {
      constructor: CommandError,
      message: "Invalid argument: ATS",
    });
  });

  test("validateCompanyArgs throws when no company ids are provided", () => {
    assert.throws(() => validateCompanyArgs(["greenhouse", "", "   "]), {
      constructor: CommandError,
      message: "Invalid argument: COMPANY_IDs",
    });
  });

  test("validateJobArgs parses ats, company id, and job id", () => {
    assert.deepEqual(validateJobArgs(["Lever", " c-1 ", " j,2 "]), {
      ats: "lever",
      companyId: "c-1",
      jobId: "j2",
    });
  });

  test("validateJobArgs throws when ids are missing", () => {
    assert.throws(() => validateJobArgs(["lever", "", "job"]), {
      constructor: CommandError,
      message: "Invalid argument: COMPANY_ID",
    });

    assert.throws(() => validateJobArgs(["lever", "company", " "]), {
      constructor: CommandError,
      message: "Invalid argument: JOB_ID",
    });
  });
});
