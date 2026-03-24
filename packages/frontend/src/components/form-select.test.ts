import { expect, suite, test } from "vitest";
import { createComponent } from "../utils/testUtils";
import { FormElement } from "./form-element";
import { FormSelect } from "./form-select";

type Testable = FormSelect & {
  intake: FormElement["intake"];
};

function readOptions(element: HTMLSelectElement) {
  return [...element.options].map((option) => ({
    label: option.textContent,
    value: option.value,
  }));
}

suite("FormSelect", () => {
  test("adds an Any option before provided options and stringifies values", () => {
    const element = createComponent(FormSelect) as Testable;

    element.init({
      label: "Employment type",
      name: "employmentType",
      options: [
        { label: "Full-time", value: "full-time" },
        { label: "Contract", value: 12 },
        { label: "Remote", value: true },
        { label: "Unset", value: undefined },
      ],
    });

    expect(readOptions(element.intake as HTMLSelectElement)).toEqual([
      { label: "Any", value: "" },
      { label: "Full-time", value: "full-time" },
      { label: "Contract", value: "12" },
      { label: "Remote", value: "true" },
      { label: "Unset", value: "" },
    ]);
  });

  test("renders only the default Any option when options are omitted", () => {
    const element = createComponent(FormSelect) as Testable;

    element.init({
      label: "Experience",
      name: "experience",
    });

    expect(readOptions(element.intake as HTMLSelectElement)).toEqual([
      { label: "Any", value: "" },
    ]);
  });

  test("replaces existing options on subsequent init calls", () => {
    const element = createComponent(FormSelect) as Testable;

    element.init({
      label: "Team",
      name: "team",
      options: [
        { label: "Platform", value: "platform" },
        { label: "Design", value: "design" },
      ],
    });

    element.init({
      label: "Team",
      name: "team",
      options: [{ label: "Growth", value: "growth" }],
    });

    expect(readOptions(element.intake as HTMLSelectElement)).toEqual([
      { label: "Any", value: "" },
      { label: "Growth", value: "growth" },
    ]);
  });
});
