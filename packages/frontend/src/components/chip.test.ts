import { expect, suite, test, vi } from "vitest";
import type { XrayComponent } from "../utils/testUtils";
import { CHIP_DELETE, Chip } from "./chip";

type Xray = XrayComponent<Chip>;

suite("Chip", () => {
  test("creates a chip with the provided label", () => {
    const element = Chip.create({ label: "Remote" }) as Xray;

    const label = element.getEl("label");
    const deleteButton = element.getEl("delete");

    expect(label?.textContent).toBe("Remote");
    expect(deleteButton).toBeInstanceOf(HTMLButtonElement);
    expect(deleteButton?.style.display).toBe("");
  });

  test.for([true, false, undefined])(
    "Proper fill variant if filled=%s",
    (filled) => {
      const element = Chip.create({ label: "Hybrid", filled }) as Xray;

      expect(element.container.classList.contains("filled")).toBe(!!filled);
    },
  );

  test.for([undefined, "", "provided"])(
    "Delete affordance if deleteKey=%s",
    (deleteKey) => {
      const expected = deleteKey ? "inline-flex" : "";
      const element = Chip.create({ label: "Hybrid", deleteKey }) as Xray;
      const deleteButton = element.getEl("delete") as HTMLButtonElement;

      expect(deleteButton.style.display).toBe(expected);
    },
  );

  test("hides the chip and emits delete event when delete button is clicked", () => {
    const element = Chip.create({
      label: "Remote",
      deleteKey: "location",
    }) as Xray;
    const handler = vi.fn();
    const deleteButton = element.getEl("delete") as HTMLButtonElement;

    element.addEventListener(CHIP_DELETE, handler);

    deleteButton.click();

    expect(element.style.display).toBe("none");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]).toBeInstanceOf(CustomEvent);
    expect((handler.mock.calls[0]?.[0] as CustomEvent).detail).toBe("location");
  });
});
