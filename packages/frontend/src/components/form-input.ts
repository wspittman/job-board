import { ComponentBase } from "./componentBase";
import {
  FormElement,
  type FormElementProps,
  type FormValue,
} from "./form-element";

import css from "./form-input.css?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jb-form-input";

/**
 * Custom form element that wraps a text input with adornments and validation.
 * Extends {@link FormElement} to provide numeric validation and prefix/suffix rendering.
 */
export class FormInput extends FormElement {
  #validation?: FormElementProps["validation"];

  /**
   * Creates an instance of the input element with associated styles.
   */
  constructor() {
    super("input", cssSheet);
  }

  /**
   * Initializes the input with adornments and optional validation rules.
   * @param props - The configuration options for the input component
   */
  override init({ prefix, suffix, validation, ...rest }: FormElementProps) {
    super.init(rest);
    this.#validation = validation;

    if (this.#validation?.type === "int") {
      this.intake.inputMode = "numeric";
    }

    this.#createAdornment(true, prefix);
    this.#createAdornment(false, suffix);
  }

  /**
   * Applies validation before storing the provided value.
   * @param value - The new value to assign to the input
   */
  override set value(value: FormValue) {
    super.value = this.#validate(value);
  }

  /**
   * Ensures runtime input remains valid and propagates updates when appropriate.
   */
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

  #validate(value: FormValue): string {
    if (this.#validation?.type === "int") {
      return this.#intOnly(value);
    }
    return String(value ?? "");
  }

  #intOnly(value: FormValue): string {
    const prevVal = this.getAttribute("value") ?? "";
    const val = String(value ?? "").trim();

    if (val === "") return val;
    if (!/^\d+$/.test(val)) return prevVal;

    const { min = 0, max = Number.MAX_SAFE_INTEGER } = this.#validation ?? {};
    const num = Number.parseInt(val, 10);
    if (Number.isNaN(num) || num < min || num > max) return prevVal;

    return String(num);
  }
}

ComponentBase.register(tag, FormInput);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: FormInput;
  }
}
