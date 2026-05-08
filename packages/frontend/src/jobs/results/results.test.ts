import { expect, suite, test } from "vitest";
import { createJobModel, type XrayComponent } from "../../utils/testUtils";
import { Results } from "./results";

type Xray = XrayComponent<Results>;

const create = (): Xray => document.createElement("jobs-results") as Xray;

function isCardSelected(el: Element): boolean {
  const xray = el as XrayComponent;
  return xray.getEl("container")?.classList.contains("is-selected") ?? false;
}

suite("Results", () => {
  test("renders a job-card for each job in updateJobs", () => {
    const element = create();
    element.updateJobs([
      createJobModel({ id: "j1" }),
      createJobModel({ id: "j2" }),
      createJobModel({ id: "j3" }),
    ]);
    expect(
      element.getEl("list")!.querySelectorAll("jobs-job-card"),
    ).toHaveLength(3);
  });

  test("empty state: updateJobs([]) shows no job-cards and a message-card", () => {
    const element = create();
    element.updateJobs([]);
    const list = element.getEl("list")!;
    expect(list.querySelector("jobs-job-card")).toBeNull();
    expect(list.querySelector("jobs-message-card")).not.toBeNull();
  });

  test("first card is selected by default after updateJobs", () => {
    const element = create();
    element.updateJobs([
      createJobModel({ id: "j1" }),
      createJobModel({ id: "j2" }),
    ]);
    const cards = element.getEl("list")!.querySelectorAll("jobs-job-card");
    expect(isCardSelected(cards[0]!)).toBe(true);
    expect(isCardSelected(cards[1]!)).toBe(false);
  });

  test("selectCard moves selection to the matching card", () => {
    const element = create();
    element.updateJobs([
      createJobModel({ id: "j1" }),
      createJobModel({ id: "j2" }),
    ]);
    element.selectCard("j2");
    const cards = element.getEl("list")!.querySelectorAll("jobs-job-card");
    expect(isCardSelected(cards[0]!)).toBe(false);
    expect(isCardSelected(cards[1]!)).toBe(true);
  });
});
