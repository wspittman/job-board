import { expect, suite, test, vi } from "vitest";
import { createComponent, spies } from "../utils/testUtils";
import { FORM_ELEMENT_UPDATE, FormElement } from "./form-element";

class TestFormElement extends FormElement {
  constructor(intakeType: "input" | "select" | "textarea") {
    super(intakeType, new CSSStyleSheet());
  }
}

// Type for accessing protected members of FormElement in tests
type Testable = TestFormElement & {
  shadowRoot: ShadowRoot;
  intake: FormElement["intake"];
  getFormValue: FormElement["getFormValue"];
  getEl: FormElement["getEl"];
};

suite("FormElement", () => {
  test.for(["input", "textarea", "select"] as const)(
    "creates the expected native intake for %s",
    (intakeType) => {
      const expectedIntakeTag = intakeType.toUpperCase();
      const expectedPlaceholder = intakeType == "select" ? null : " ";
      const expectedType = intakeType === "input" ? "text" : null;

      const element = createComponent(TestFormElement, intakeType) as Testable;
      const intakeWrap = element.getEl("intake-wrap");

      expect(element.intake.tagName).toBe(expectedIntakeTag);
      expect(element.intake.id).toBe("intake");
      expect(element.intake.className).toBe("intake");
      expect(intakeWrap?.firstElementChild).toBe(element.intake);
      expect(element.intake.getAttribute("placeholder")).toBe(
        expectedPlaceholder,
      );
      expect(element.intake.getAttribute("type")).toBe(expectedType);
      expect(spies.setFormValue).not.toHaveBeenCalled();
    },
  );

  test("initializes label, name, tooltip state, and value", () => {
    const element = createComponent(TestFormElement, "input") as Testable;

    element.init({
      label: "Salary",
      name: "salary",
      tooltip: "Enter annual salary",
      value: 125000,
    });

    expect(element.getAttribute("name")).toBe("salary");
    expect(element.getAttribute("value")).toBe("125000");
    expect(element.getEl("label")?.textContent).toBe("Salary");
    expect(element.getEl("legend")?.textContent).toBe("Salary");
    expect(element.getEl("tooltip")?.textContent).toBe("Enter annual salary");
    expect(element.getEl("help")?.hasAttribute("hidden")).toBe(false);
    expect(element.intake.value).toBe("125000");
    expect(element.intake.classList.contains("has-value")).toBe(true);
    expect(spies.setFormValue).toHaveBeenCalledWith("125000");
  });

  test("keeps help hidden when tooltip is omitted", () => {
    const element = createComponent(TestFormElement, "input") as Testable;

    element.init({
      label: "Keywords",
      name: "keywords",
    });

    expect(element.getEl("help")?.hasAttribute("hidden")).toBe(true);
    expect(element.getEl("tooltip")?.textContent).toBe("");
  });

  test("syncs value changes through the custom form value contract", () => {
    const element = createComponent(TestFormElement, "input") as Testable;
    vi.spyOn(element, "getFormValue").mockImplementation(
      () => `serialized:${element.intake.value}`,
    );

    const updateSpy = vi.fn();
    element.addEventListener(FORM_ELEMENT_UPDATE, updateSpy);
    element.value = "backend";

    expect(element.getAttribute("value")).toBe("serialized:backend");
    expect(element.intake.value).toBe("backend");
    expect(element.intake.classList.contains("has-value")).toBe(true);
    expect(spies.setFormValue).toHaveBeenCalledWith("serialized:backend");
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy.mock.calls[0]?.[0]).toBeInstanceOf(CustomEvent);
    expect((updateSpy.mock.calls[0]?.[0] as CustomEvent).detail).toBe(
      "serialized:backend",
    );
  });

  test("clears the synced value state for undefined values", () => {
    const element = createComponent(TestFormElement, "input") as Testable;

    element.value = "hello";
    element.value = undefined;

    expect(element.intake.value).toBe("");
    expect(element.getAttribute("value")).toBe("");
    expect(element.intake.classList.contains("has-value")).toBe(false);
    expect(spies.setFormValue).toHaveBeenLastCalledWith("");
  });

  test("responds to bubbling input events from the native intake", () => {
    const element = createComponent(TestFormElement, "textarea") as Testable;

    element.intake.value = "new text";
    element.intake.dispatchEvent(
      new InputEvent("input", { bubbles: true, composed: true }),
    );

    expect(element.getAttribute("value")).toBe("new text");
    expect(spies.setFormValue).toHaveBeenCalledWith("new text");
  });

  test("toggles the disabled attribute on the native intake", () => {
    const element = createComponent(TestFormElement, "select") as Testable;

    element.disabled = true;
    expect(element.intake.getAttribute("disabled")).toBe("true");

    element.disabled = false;
    expect(element.intake.hasAttribute("disabled")).toBe(false);
  });

  test("exposes the expected static form-associated metadata", () => {
    expect(FormElement.formAssociated).toBe(true);
    expect(FormElement.observedAttributes).toEqual(["name", "value"]);
  });
});
