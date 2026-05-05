import { afterEach, expect, suite, test, vi } from "vitest";
import { FilterModel } from "../api/filterModel";
import {
  mockInterpretQuery,
  mockInterpretQueryErr,
  type XrayComponent,
} from "../utils/testUtils";
import { FORM_ELEMENT_UPDATE } from "./form-element";
import { NL_SEARCH_RESULT, NLSearch } from "./nl-search";

type Xray = XrayComponent<NLSearch>;

async function createLoaded(attrs: Record<string, string> = {}): Promise<Xray> {
  const element = document.createElement("jb-nl-search") as Xray;
  for (const [k, v] of Object.entries(attrs)) {
    element.setAttribute(k, v);
  }
  await element.onLoad();
  return element;
}

/** Sets the query value and fires the FORM_ELEMENT_UPDATE event on the host. */
function setQuery(element: Xray, value: string): void {
  element.getEl("query")!.setAttribute("value", value);
  element.dispatchEvent(new CustomEvent(FORM_ELEMENT_UPDATE));
}

suite("NLSearch", () => {
  afterEach(vi.unstubAllGlobals);

  test("update button is disabled when query is empty", async () => {
    const element = await createLoaded();
    expect(element.getEl<HTMLButtonElement>("update")!.disabled).toBe(true);
  });

  test("update button is enabled when query has a value", async () => {
    const element = await createLoaded();
    setQuery(element, "remote software engineer");
    expect(element.getEl<HTMLButtonElement>("update")!.disabled).toBe(false);
  });

  test("shows loading state while API call is in progress", async () => {
    const element = await createLoaded();
    mockInterpretQuery({});
    setQuery(element, "remote jobs");
    const updateBtn = element.getEl<HTMLButtonElement>("update")!;
    updateBtn.click();
    expect(updateBtn.disabled).toBe(true);
    expect(updateBtn.textContent).toBe("Searching...");
  });

  test("emits NL_SEARCH_RESULT with a FilterModel detail on successful search", async () => {
    const element = await createLoaded();
    mockInterpretQuery({ isRemote: true });
    const handler = vi.fn();
    element.addEventListener(NL_SEARCH_RESULT, handler);

    setQuery(element, "remote jobs");
    element.getEl<HTMLButtonElement>("update")!.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(1);
    const detail = (handler.mock.calls[0]?.[0] as CustomEvent)
      .detail as FilterModel;
    expect(detail).toBeInstanceOf(FilterModel);
    expect(detail.toLocationSearchString()).toContain("isRemote=true");
  });

  test("shows error message when API call fails", async () => {
    const element = await createLoaded();
    mockInterpretQueryErr();
    setQuery(element, "remote jobs");
    element.getEl<HTMLButtonElement>("update")!.click();
    await Promise.resolve();
    await Promise.resolve();

    const errorEl = element.getEl("error")!;
    expect(errorEl.hidden).toBe(false);
    expect(errorEl.textContent).toBe("Failed. Please try again.");
    expect(element.getEl<HTMLButtonElement>("update")!.textContent).toBe(
      "Search",
    );
  });

  test("redirect: navigates to /jobs with filter query after successful search", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign, origin: window.location.origin });
    mockInterpretQuery({ isRemote: true });

    const element = await createLoaded({ redirect: "" });
    setQuery(element, "remote jobs");
    element.getEl<HTMLButtonElement>("update")!.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(assign).toHaveBeenCalledWith(expect.stringMatching(/^\/jobs\?/));
  });
});
