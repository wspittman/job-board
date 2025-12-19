import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { AppError } from "../../src/utils/AppError.ts";

suite("AppError", () => {
  test("defaults statusCode to 400", () => {
    const error = new AppError("Something went wrong");

    assert.equal(error.message, "Something went wrong");
    assert.equal(error.statusCode, 400);
    assert.equal(error.innerError, undefined);
  });

  test("stores explicit statusCode and inner error", () => {
    const inner = new Error("Inner error");
    const error = new AppError("Top error", 500, inner);

    assert.equal(error.message, "Top error");
    assert.equal(error.statusCode, 500);
    assert.equal(error.innerError, inner);
  });

  const toErrorListCases: Array<[string, AppError, string[]]> = [
    [
      "AppError chain",
      new AppError("Top", 401, new AppError("Middle", 500, new Error("Root"))),
      ["[401] Top", "[500] Middle", "Root"],
    ],
    [
      "non-error inner value",
      new AppError("Top", 400, "string detail"),
      ["[400] Top", "string detail"],
    ],
  ];

  toErrorListCases.forEach(([name, error, expected]) => {
    test(`toErrorList handles ${name}`, () => {
      assert.deepEqual(error.toErrorList(), expected);
    });
  });
});
