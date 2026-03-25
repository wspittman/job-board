import { expect, suite, test } from "vitest";
import type { XrayFormElement } from "../utils/testUtils";
import { FormCombobox } from "./form-combobox";

type Xray = XrayFormElement<FormCombobox>;

const create = () => document.createElement("jb-form-combobox") as Xray;

function readMenuOptions(element: Xray) {
  return Array.from(element.shadowRoot?.querySelectorAll(".option") ?? []).map(
    (option) => ({
      text: option.textContent,
      value: (option as HTMLLIElement).dataset["value"],
      active: option.classList.contains("active"),
    }),
  );
}

function getMenuEl(element: Xray) {
  return element.shadowRoot?.querySelector(".options") as HTMLUListElement;
}

suite("FormCombobox", () => {
  test("initializes combobox semantics and menu container", () => {
    const element = create();
    const menu = getMenuEl(element);

    expect(element.intake.getAttribute("autocomplete")).toBe("off");
    expect(element.intake.getAttribute("role")).toBe("combobox");
    expect(menu).toBeTruthy();
    expect(menu?.getAttribute("role")).toBe("listbox");
    expect(menu.hidden).toBe(true);
  });

  test("maps selected option labels to a submitted form value", () => {
    const element = create();
    element.init({
      label: "Team",
      name: "team",
      options: [
        { label: "Platform", value: "platform" },
        { label: "Design", value: 12 },
      ],
    });

    element.value = 12;

    expect(element.intake.value).toBe("Design");
    expect(element.getAttribute("value")).toBe("12");
    expect(getMenuEl(element).hidden).toBe(true);
  });

  test("filters menu options on input with case-insensitive trimmed matching", () => {
    const element = create();
    element.init({
      label: "Role",
      name: "role",
      options: [
        { label: "Backend Engineer", value: "backend" },
        { label: "Designer", value: "design" },
      ],
      value: "backend",
    });

    element.intake.value = "  engIneEr ";
    element.intake.dispatchEvent(
      new InputEvent("input", { bubbles: true, composed: true }),
    );

    expect(element.getAttribute("value")).toBe("");
    expect(readMenuOptions(element)).toEqual([
      { text: "Backend Engineer", value: "backend", active: true },
    ]);
    expect(getMenuEl(element).hidden).toBe(false);
  });

  test("renders the empty menu option when filtering yields no matches", () => {
    const element = create();
    element.init({
      label: "Role",
      name: "role",
      options: [{ label: "Backend Engineer", value: "backend" }],
    });

    element.intake.value = "zzz";
    element.intake.dispatchEvent(
      new InputEvent("input", { bubbles: true, composed: true }),
    );

    expect(readMenuOptions(element)).toEqual([
      { text: "No options", value: "", active: false },
    ]);
  });

  test("selects the active option on Enter and closes the menu", () => {
    const element = create();
    element.init({
      label: "Role",
      name: "role",
      options: [
        { label: "Backend Engineer", value: "backend" },
        { label: "Designer", value: "design" },
      ],
    });

    element.intake.value = "des";
    element.intake.dispatchEvent(
      new InputEvent("input", { bubbles: true, composed: true }),
    );
    element.intake.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    expect(element.intake.value).toBe("Designer");
    expect(element.getAttribute("value")).toBe("design");
    expect(getMenuEl(element).hidden).toBe(true);
  });

  test("keeps menu open for internal focus moves and closes for external focus", () => {
    const element = create();
    element.init({
      label: "Role",
      name: "role",
      options: [{ label: "Backend Engineer", value: "backend" }],
    });

    document.body.append(element);
    element.intake.dispatchEvent(new FocusEvent("focus"));

    const firstOption = element.shadowRoot?.querySelector(".option");
    element.dispatchEvent(
      new FocusEvent("focusout", { relatedTarget: firstOption }),
    );

    expect(getMenuEl(element).hidden).toBe(false);

    element.dispatchEvent(
      new FocusEvent("focusout", { relatedTarget: document.body }),
    );

    expect(getMenuEl(element).hidden).toBe(true);
  });
});
