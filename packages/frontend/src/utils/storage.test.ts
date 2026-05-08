import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
// navigator.sendBeacon is stubbed in testSetup.ts so the module-level beacon() call is safe
import { getStorageIds } from "./storage";

suite("getStorageIds", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(vi.restoreAllMocks);

  test("first call generates non-empty IDs and writes them to storage", () => {
    const ids = getStorageIds();
    expect(ids["visitorId"]).toBeTruthy();
    expect(ids["sessionId"]).toBeTruthy();
    expect(localStorage.getItem("visitorId")).toBe(ids["visitorId"]);
    expect(sessionStorage.getItem("sessionId")).toBe(ids["sessionId"]);
  });

  test("subsequent call returns the same IDs", () => {
    const first = getStorageIds();
    const second = getStorageIds();
    expect(second["visitorId"]).toBe(first["visitorId"]);
    expect(second["sessionId"]).toBe(first["sessionId"]);
  });

  test('target="headers" uses header key names', () => {
    const ids = getStorageIds("headers");
    expect(ids["Jb-Visitor-Id"]).toBeTruthy();
    expect(ids["Jb-Session-Id"]).toBeTruthy();
    expect(ids["visitorId"]).toBeUndefined();
    expect(ids["sessionId"]).toBeUndefined();
  });

  test("localStorage error omits visitorId without throwing", () => {
    // jsdom's localStorage getItem is on Storage.prototype; spy there so the
    // mock intercepts the call inside the module.  mockImplementationOnce lets
    // the second call (sessionStorage) proceed normally.
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("SecurityError");
    });
    const ids = getStorageIds();
    expect(ids["visitorId"]).toBeUndefined();
    expect(ids["sessionId"]).toBeTruthy();
  });
});
