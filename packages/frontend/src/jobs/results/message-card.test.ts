import { expect, suite, test } from "vitest";
import type { XrayComponent } from "../../utils/testUtils";
import { MessageCard } from "./message-card";

type Xray = XrayComponent<MessageCard>;

suite("MessageCard", () => {
  test.for([
    [-1, "Add Filters To Begin"],
    [0, "No Matches Found"],
    [24, "24 Matches Shown"],
    [5, "All Matches Shown"],
    [10, "All Matches Shown"],
  ] as [number, string][])(
    "countToMessage: count=%s renders title %s",
    ([count, expectedTitle]) => {
      const element = MessageCard.create({ count }) as unknown as Xray;
      expect(element.getEl("title")?.textContent).toBe(expectedTitle);
    },
  );

  test("create with explicit message renders title, subtitle, and body", () => {
    const element = MessageCard.create({
      message: "AllMatches",
    }) as unknown as Xray;
    expect(element.getEl("title")?.textContent).toBe("All Matches Shown");
    expect(element.getEl("subtitle")?.textContent).toBe(
      "Are these great matches?",
    );
    expect(element.getEl("message")?.textContent).toContain(
      "bookmark this page",
    );
  });

  test("Error variant adds error-card class to container", () => {
    const element = MessageCard.create({ message: "Error" }) as unknown as Xray;
    expect(element.container.classList.contains("error-card")).toBe(true);
  });

  test("non-Error variant does not have error-card class", () => {
    const element = MessageCard.create({
      message: "NoMatches",
    }) as unknown as Xray;
    expect(element.container.classList.contains("error-card")).toBe(false);
  });

  test("count-derived message: no args defaults to AddFilters", () => {
    const element = MessageCard.create({}) as unknown as Xray;
    expect(element.getEl("title")?.textContent).toBe("Add Filters To Begin");
  });
});
