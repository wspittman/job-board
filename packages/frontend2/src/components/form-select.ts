import { ComponentBase } from "./componentBase";
import {
  FormElement,
  type FormElementProps,
  type FormOption,
} from "./form-element";

import css from "./form-select.css?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jb-form-select";

export class FormSelect extends FormElement {
  constructor() {
    super("select", cssSheet);
  }

  override init({ options = [], ...rest }: FormElementProps) {
    super.init(rest);
    this.#setOptions(options);
  }

  #setOptions(options: FormOption[]) {
    const optionEls = options.map(({ label, value }) => {
      const option = document.createElement("option");
      option.textContent = label;
      option.value = String(value ?? "");
      return option;
    });

    this.intake.replaceChildren(...optionEls);
  }
}

ComponentBase.register(tag, FormSelect);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: FormSelect;
  }
}
