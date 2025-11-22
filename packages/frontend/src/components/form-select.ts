import { ComponentBase } from "./componentBase";
import {
  FormElement,
  type FormElementProps,
  type FormOption,
} from "./form-element";

import css from "./form-select.css?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jb-form-select";

/**
 * Custom element that wraps a native select input with shared form styling.
 * Allows declarative option initialization while leveraging the base form logic.
 */
export class FormSelect extends FormElement {
  /**
   * Creates a select-backed form element with shared styles.
   */
  constructor() {
    super("select", cssSheet);
  }

  /**
   * Hydrates the select element with options and initializes shared state.
   * @param props - The configuration payload for the select component
   */
  override init({ options = [], ...rest }: FormElementProps) {
    super.init(rest);
    this.#setOptions([{ label: "Any", value: "" }, ...options]);
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
