import { afterEach, beforeEach, expect, suite, test } from "vitest";
import {
  mockMetadata,
  mockMetadataErr,
  type XrayComponent,
} from "../utils/testUtils";
// Import to trigger custom element registration
import "./stats";

type Xray = XrayComponent;

suite("Stats", () => {
  let element: Xray;

  beforeEach(() => {
    element = document.createElement("home-stats") as unknown as Xray;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test("renders count strings after onLoad", async () => {
    mockMetadata();
    await element.onLoad();
    expect(element.getEl("job-count")?.textContent).toBe(
      (1000).toLocaleString(undefined, { notation: "compact" }),
    );
    expect(element.getEl("company-count")?.textContent).toBe(
      (3).toLocaleString(undefined, { notation: "compact" }),
    );
    expect(element.getEl("remote-pct")?.textContent).toBe("40%");
    expect(element.getEl("job-recent-count")?.textContent).toBe(
      (100).toLocaleString(undefined, { notation: "compact" }),
    );
  });

  test("becomes visible after successful load", async () => {
    mockMetadata();
    await element.onLoad();
    expect(element.style.display).toBe("block");
  });

  test("disconnected guard: texts not set when element is not connected", async () => {
    // Create a fresh element that is never appended to the DOM
    const disconnected = document.createElement(
      "home-stats",
    ) as unknown as Xray;
    mockMetadata();
    await disconnected.onLoad();

    expect(disconnected.getEl("job-count")?.textContent).toBe("");
    expect(disconnected.style.display).not.toBe("block");
  });

  test("error swallowing: element remains hidden if getCountStrings rejects", async () => {
    mockMetadataErr();
    await expect(element.onLoad()).resolves.toBeUndefined();
    expect(element.style.display).not.toBe("block");
  });
});
