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

    if (this.#validation?.type === "int") {
      this.intake.inputMode = "numeric";
    }

    this.#createAdornment(true, prefix);
    this.#createAdornment(false, suffix);
  }

  override set value(value: unknown) {
    super.value = this.#validate(value);
  }

  protected override onInput() {
    const next = this.#validate(this.intake.value);
    if (next !== this.intake.value) {
      this.intake.value = next;
      return;
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

  #validate(value: unknown): string {
    if (this.#validation?.type === "int") {
      return this.#intOnly(value);
    }
    return String(value ?? "");
  }

  #intOnly(value: unknown): string {
    const prevVal = this.getAttribute("value") ?? "";
    const val = String(value ?? "").trim();

    if (val === "") return val;
    if (!/^-?\d+$/.test(val)) return prevVal;

    let num = Number.parseInt(val, 10);
    if (Number.isNaN(num)) return prevVal;

    const { min, max } = this.#validation ?? {};
    if (min != null && num < min) return prevVal;
    if (max != null && num > max) return prevVal;

    return String(num);
  }
}

ComponentBase.register(tag, FormInput);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: FormInput;
  }
}
