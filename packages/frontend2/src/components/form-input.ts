import { ComponentBase } from "./componentBase";
import { FormElement, type FormElementProps } from "./form-element";

import css from "./form-input.css?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jb-form-input";

export class FormInput extends FormElement {
  #validation?: FormElementProps["validation"];

  constructor() {
    super("input", cssSheet);
  }

  override init({ prefix, suffix, validation, ...rest }: FormElementProps) {
    super.init(rest);
    this.#validation = validation;
    this.intake.inputMode = "";
    if (this.#validation?.type === "numeric") {
      this.intake.inputMode = "numeric";
    }
    this.#createAdornment(true, prefix);
    this.#createAdornment(false, suffix);
  }

  override set value(value: unknown) {
    const next = this.#validation?.type === "numeric"
      ? this.#sanitizeNumeric(String(value ?? ""))
      : String(value ?? "");
    super.value = next;
  }

  protected override onInput() {
    if (this.#validation?.type === "numeric") {
      const sanitized = this.#sanitizeNumeric(this.intake.value);
      if (sanitized !== this.intake.value) {
        this.intake.value = sanitized;
      }
    }
    super.onInput();
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

  #sanitizeNumeric(value: string): string {
    const digitsOnly = value.replace(/\D+/g, "");
    if (!digitsOnly) return "";

    let num = Number.parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) {
      return "";
    }

    const { min, max } = this.#validation ?? {};
    if (typeof min === "number") {
      num = Math.max(num, min);
    }
    if (typeof max === "number") {
      num = Math.min(num, max);
    }

    return String(num);
  }
}

ComponentBase.register(tag, FormInput);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: FormInput;
  }
}
