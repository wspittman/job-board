import { expect, suite, test, vi } from "vitest";
import type { XrayFormElement } from "../utils/testUtils";
import { FORM_ELEMENT_UPDATE } from "./form-element";
import { FormInput } from "./form-input";

type Xray = XrayFormElement<FormInput>;

const create = () => document.createElement("jb-form-input") as Xray;
const getContainer = (element: Xray) =>
  element.shadowRoot.querySelector(".container");

suite("FormInput", () => {
  test("applies input constraints and renders optional adornments", () => {
    const element = create();
    element.init({
      label: "Salary",
      name: "salary",
      maxLength: 6,
      prefix: "$",
      suffix: "USD",
      validation: { type: "int" },
    });

    const intakeWrap = element.getEl("intake-wrap");
    const [prefix, intake, suffix] = Array.from(intakeWrap?.children ?? []);

    expect(element.intake.inputMode).toBe("numeric");
    expect((element.intake as HTMLInputElement).maxLength).toBe(6);
    expect(prefix?.textContent).toBe("$");
    expect(prefix?.className).toBe("adornment");
    expect(intake).toBe(element.intake);
    expect(suffix?.textContent).toBe("USD");
    expect(suffix?.className).toBe("adornment");
    expect(getContainer(element)?.classList.contains("has-value")).toBe(true);
  });

  test("does not duplicate adornments on subsequent init calls", () => {
    const element = create();

    element.init({
      label: "Salary",
      name: "salary",
      prefix: "$",
      suffix: "USD",
    });

    element.init({
      label: "Salary",
      name: "salary",
      prefix: "$",
      suffix: "USD",
    });

    const intakeWrap = element.getEl("intake-wrap");
    const adornments = intakeWrap?.querySelectorAll(".adornment") ?? [];

    expect(adornments).toHaveLength(2);
  });

  test("clears prefixed visual state when reinitialized without a prefix", () => {
    const element = create();

    element.init({
      label: "Salary",
      name: "salary",
      prefix: "$",
    });

    element.init({
      label: "Salary",
      name: "salary",
    });

    expect(element.intake.value).toBe("");
    expect(getContainer(element)?.classList.contains("has-value")).toBe(false);
  });

  test("leaves inputMode and maxLength untouched without integer validation or maxLength", () => {
    const element = create();
    element.init({
      label: "Keywords",
      name: "keywords",
    });

    expect(element.intake.inputMode).toBe("");
    expect((element.intake as HTMLInputElement).maxLength).toBe(-1);
  });

  test.for([
    ["keeps valid integer value", "15", "15"],
    ["normalizes whitespace and leading zeroes", " 007 ", "7"],
  ])("integer validation %s", ([, value, expected]) => {
    const element = create();
    element.init({
      label: "Openings",
      name: "openings",
      validation: { type: "int" },
    });

    element.value = value;

    expect(element.getAttribute("value")).toBe(expected);
    expect(element.intake.value).toBe(expected);
  });

  test.for([
    ["rejects non-numeric text", "abc"],
    ["rejects values above max", "21"],
    ["rejects values below min", "9"],
  ])("integer validation %s and preserves previous value", ([, value]) => {
    const element = create();
    element.init({
      label: "Openings",
      name: "openings",
      validation: { type: "int", min: 10, max: 20 },
    });

    element.value = "17";
    element.value = value;

    expect(element.getAttribute("value")).toBe("17");
    expect(element.intake.value).toBe("17");
  });

  test("restores prior valid value on invalid input events without emitting update", () => {
    const element = create();
    const updateSpy = vi.fn();
    element.init({
      label: "Openings",
      name: "openings",
      validation: { type: "int", min: 1, max: 99 },
      value: 42,
    });

    element.addEventListener(FORM_ELEMENT_UPDATE, updateSpy);

    element.intake.value = "42abc";
    element.intake.dispatchEvent(
      new InputEvent("input", { bubbles: true, composed: true }),
    );

    expect(element.intake.value).toBe("42");
    expect(element.getAttribute("value")).toBe("42");
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
