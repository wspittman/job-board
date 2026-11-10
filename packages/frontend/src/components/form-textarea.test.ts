import { expect, suite, test } from "vitest";
import type { XrayFormElement } from "../utils/testUtils";
import { FormTextarea } from "./form-textarea";

type Xray = XrayFormElement<FormTextarea>;

const create = () => document.createElement("jb-form-textarea") as Xray;

suite("FormTextarea", () => {
  test("applies textarea-specific rows and maxLength when provided", () => {
    const element = create();
    element.init({
      label: "Description",
      name: "description",
      rows: 8,
      maxLength: 500,
    });

    const intake = element.intake as HTMLTextAreaElement;
    expect(intake.rows).toBe(8);
    expect(intake.maxLength).toBe(500);
  });

  test("keeps default rows and maxLength when textarea-specific props are omitted", () => {
    const element = create();
    element.init({
      label: "Notes",
      name: "notes",
    });

    const intake = element.intake as HTMLTextAreaElement;
    expect(intake.rows).toBe(2);
    expect(intake.maxLength).toBe(-1);
  });

  test("clear resets value without setting an inline height", () => {
    const element = create();
    element.init({
      label: "Summary",
      name: "summary",
      value: "Existing text",
    });

    element.clear();

    expect(element.intake.value).toBe("");
    expect(element.getAttribute("value")).toBe("");
    expect(element.intake.style.height).toBe("");
  });

  test("input syncs value without setting an inline height", () => {
    const element = create();
    element.init({
      label: "Details",
      name: "details",
    });

    element.intake.value = "Line 1\nLine 2";
    element.intake.dispatchEvent(
      new InputEvent("input", { bubbles: true, composed: true }),
    );

    expect(element.intake.style.height).toBe("");
    expect(element.getAttribute("value")).toBe("Line 1\nLine 2");
  });
});
