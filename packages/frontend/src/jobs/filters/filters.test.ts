import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { FilterModel } from "../../api/filterModel";
import { metadataModel } from "../../api/metadataModel";
import { CHIP_DELETE } from "../../components/chip";
import { FORM_ELEMENT_UPDATE } from "../../components/form-element";
import { NL_SEARCH_RESULT } from "../../components/nl-search";
import type { XrayComponent, XrayFormElement } from "../../utils/testUtils";
import { FILTERS_UPDATED, Filters } from "./filters";

const DEBOUNCE_DELAY = 500;

type Xray = XrayComponent<Filters>;

async function createLoaded(): Promise<Xray> {
  const element = document.createElement("jobs-filters") as Xray;
  await element.onLoad();
  return element;
}

suite("Filters", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(metadataModel, "getCompanyFormOptions").mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("FORM_ELEMENT_UPDATE debounces and emits FILTERS_UPDATED with a FilterModel", async () => {
    const element = await createLoaded();
    const handler = vi.fn();
    element.addEventListener(FILTERS_UPDATED, handler);

    element.dispatchEvent(
      new CustomEvent(FORM_ELEMENT_UPDATE, { bubbles: true }),
    );
    expect(handler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(DEBOUNCE_DELAY);

    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0]?.[0] as CustomEvent).detail).toBeInstanceOf(
      FilterModel,
    );
  });

  test("CHIP_DELETE clears the corresponding filter input value", async () => {
    const element = await createLoaded();
    const titleInput = element.shadowRoot.querySelector<HTMLElement>(
      '[name="title"]',
    ) as XrayFormElement;

    titleInput.intake.value = "engineer";

    element.dispatchEvent(
      new CustomEvent(CHIP_DELETE, { detail: "title", bubbles: true }),
    );

    expect(titleInput.intake.value).toBe("");
  });

  test("initializes order by with Any and all order options", async () => {
    const element = await createLoaded();
    const orderByInput = element.shadowRoot.querySelector<HTMLElement>(
      '[name="orderBy"]',
    ) as XrayFormElement;

    const options = [...(orderByInput.intake as HTMLSelectElement).options].map(
      ({ textContent, value }) => ({ label: textContent, value }),
    );

    expect(options).toEqual([
      { label: "Any", value: "" },
      { label: "Pay Rate", value: "highest_salary" },
      { label: "Post Time", value: "post_time" },
      { label: "Required Experience", value: "lowest_experience" },
    ]);
  });

  test("renders Results as the final filter group", async () => {
    const element = await createLoaded();
    const labels = [...element.shadowRoot.querySelectorAll(".group-label")].map(
      (label) => label.textContent,
    );

    expect(labels.at(-1)).toBe("Results");
  });

  test("preserves manual order by selection after natural language updates", async () => {
    const element = await createLoaded();
    const orderByInput = element.shadowRoot.querySelector<HTMLElement>(
      '[name="orderBy"]',
    ) as XrayFormElement;

    orderByInput.intake.value = "highest_salary";

    element.dispatchEvent(
      new CustomEvent(NL_SEARCH_RESULT, {
        bubbles: true,
        detail: FilterModel.fromApi({ title: "engineer" }),
      }),
    );

    vi.advanceTimersByTime(DEBOUNCE_DELAY);

    expect(orderByInput.intake.value).toBe("highest_salary");
  });
});
