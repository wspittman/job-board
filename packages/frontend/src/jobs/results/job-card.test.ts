import { expect, suite, test, vi } from "vitest";
import { createJobModel, type XrayComponent } from "../../utils/testUtils";
import { JOB_CARD_SELECTED, JobCard } from "./job-card";

type Xray = XrayComponent<JobCard>;

const create = (isSelected = false) =>
  JobCard.create({
    job: createJobModel({ facets: { summary: "A great job" } }),
    isSelected,
  }) as Xray;

suite("JobCard", () => {
  function checkSelected(element: Xray, expected: boolean) {
    expect(element.container.classList.contains("is-selected")).toBe(expected);
    expect(element.container.getAttribute("aria-pressed")).toBe(
      expected.toString(),
    );
  }

  test("create sets title, company, and summary from job", () => {
    const element = create();
    expect(element.getEl("title")?.textContent).toBe("Software Engineer");
    expect(element.getEl("company")?.textContent).toBe("Acme");
    expect(element.getEl("summary")?.textContent).toBe("A great job");
  });

  test("isSelected=true adds is-selected class and sets aria-pressed", () => {
    const element = create(true);
    checkSelected(element, true);
  });

  test("isSelected setter: false state removes class and updates attribute", () => {
    const element = create(true);
    element.isSelected = false;
    checkSelected(element, false);
  });

  test("setting isSelected to same value twice does not toggle the class", () => {
    const element = create();
    element.isSelected = true;
    checkSelected(element, true);
    // Second set to same value should NOT toggle the class off
    element.isSelected = true;
    checkSelected(element, true);
  });

  test("click emits JOB_CARD_SELECTED with job id as detail", () => {
    const element = create();
    const handler = vi.fn();
    element.addEventListener(JOB_CARD_SELECTED, handler);
    element.click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0]?.[0] as CustomEvent).detail).toBe("job-1");
  });
});
