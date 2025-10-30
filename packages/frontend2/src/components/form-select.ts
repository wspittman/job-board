import { ComponentBase } from "./componentBase";
import { FormElement, type FormElementProps } from "./form-element";
import css from "./form-select.css?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

interface OptionDefinition {
  label: string;
  value: unknown;
}

export interface FormSelectProps extends FormElementProps {
  options: OptionDefinition[];
}

export class FormSelect extends FormElement {
  constructor() {
    super("select", cssSheet);
  }

  override init({ options, ...rest }: FormSelectProps) {
    super.init(rest);
    this.#setOptions(options);
  }

  #setOptions(options: OptionDefinition[]) {
    const optionEls = options.map(({ label, value }) => {
      const option = document.createElement("option");
      option.textContent = label;
      option.value = String(value ?? "");
      return option;
    });

    this.intake.replaceChildren(...optionEls);
  }
}

ComponentBase.register("jb-form-select", FormSelect);

declare global {
  interface HTMLElementTagNameMap {
    "jb-form-select": FormSelect;
  }
}
