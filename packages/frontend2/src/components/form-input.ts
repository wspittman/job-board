import { ComponentBase } from "./componentBase";
import { FormElement, type FormElementProps } from "./form-element";

import css from "./form-input.css?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jb-form-input";

export class FormInput extends FormElement {
  constructor() {
    super("input", cssSheet);
  }

  override init({ prefix, suffix, ...rest }: FormElementProps) {
    super.init(rest);
    this.#createAdornment(true, prefix);
    this.#createAdornment(false, suffix);
  }

  #createAdornment(isPrefix: boolean, text?: string) {
    if (!text) return;
    const pos = isPrefix ? "beforebegin" : "afterend";
    const el = document.createElement("p");
    el.className = "adornment";
    if (isPrefix) el.classList.add("has-value");
    el.textContent = text;
    this.intake.insertAdjacentElement(pos, el);
  }
}

ComponentBase.register(tag, FormInput);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: FormInput;
  }
}
