import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { mockMetadata, mockMetadataErr } from "../utils/testUtils";

suite("faq", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML =
      '<span class="faq-note"></span><span class="faq-note"></span>';
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("sets last-refreshed text and shows .faq-note elements on success", async () => {
    mockMetadata();
    const expectedString = `Last refreshed: ${new Date(1777934360621).toLocaleString()}`;
    await import("./faq");

    const els = document.querySelectorAll<HTMLElement>(".faq-note");
    expect(els[0]?.textContent).toBe(expectedString);
    expect(els[0]?.style.display).toBe("block");
    expect(els[1]?.textContent).toBe(expectedString);
  });

  test("swallows error silently if getTimestampString rejects", async () => {
    mockMetadataErr();
    await import("./faq");

    const els = document.querySelectorAll<HTMLElement>(".faq-note");
    expect(els[0]?.textContent).toBe("");
    expect(els[0]?.style.display).not.toBe("block");
  });
});
