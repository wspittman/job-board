import { expect, suite, test, vi } from "vitest";
import { CHIP_DELETE, Chip } from "./chip";

function getShadowElement<T extends HTMLElement>(
  chip: Chip,
  id: string,
): T | null {
  return chip.shadowRoot?.getElementById(id) as T | null;
}

suite("Chip", () => {
  test.each([
    {
      name: "renders the provided label without the filled variant by default",
      props: { label: "Remote" },
      expectedFilled: false,
    },
    {
      name: "applies the filled variant when requested",
      props: { label: "Remote", filled: true },
      expectedFilled: true,
    },
  ])("$name", ({ props, expectedFilled }) => {
    const chip = Chip.create(props);
    const label = getShadowElement<HTMLSpanElement>(chip, "label");
    const container = getShadowElement<HTMLSpanElement>(chip, "container");

    expect(label?.textContent).toBe("Remote");
    expect(container?.classList.contains("filled")).toBe(expectedFilled);
  });

  test("shows and wires the delete button when a delete key is provided", () => {
    const chip = Chip.create({ label: "Remote", deleteKey: "remote" });
    const deleteButton = getShadowElement<HTMLButtonElement>(chip, "delete");
    const deleteSpy = vi.fn<(event: Event) => void>();

    chip.addEventListener(CHIP_DELETE, deleteSpy);
    deleteButton?.click();

    expect(deleteButton?.style.display).toBe("inline-flex");
    expect(chip.style.display).toBe("none");
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy.mock.calls[0]?.[0]).toBeInstanceOf(CustomEvent);
    expect((deleteSpy.mock.calls[0]?.[0] as CustomEvent<string>).detail).toBe(
      "remote",
    );
  });

  test("leaves the delete button hidden and inert when no delete key is provided", () => {
    const chip = Chip.create({ label: "Remote" });
    const deleteButton = getShadowElement<HTMLButtonElement>(chip, "delete");
    const deleteSpy = vi.fn();

    chip.addEventListener(CHIP_DELETE, deleteSpy);
    deleteButton?.click();

    expect(deleteButton?.style.display).toBe("");
    expect(chip.style.display).toBe("");
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
