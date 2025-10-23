import { ComponentBase } from "./componentBase";
import css from "./form-input.css?raw";
import html from "./form-input.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

interface Props {
  // init-only
  label: string;
  name: string;
  onChange?: () => void;
  prefix?: string;
  suffix?: string;

  // editable
  value?: unknown;
}

export class FormInput extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

  init({ label, name, onChange, prefix, suffix, value }: Props) {
    this.setManyTexts({ label, legend: label });

    const inputEl = this.getEl<HTMLInputElement>("input");
    if (inputEl) {
      inputEl.name = name;
      inputEl.value = String(value ?? "");
      inputEl.onchange = () => onChange?.();
      inputEl.oninput = () => onChange?.();
      this.#createAdornment(inputEl, true, prefix);
      this.#createAdornment(inputEl, false, suffix);
    }
  }

  set value(value: unknown) {
    const inputEl = this.getEl<HTMLInputElement>("input");
    if (inputEl) {
      inputEl.value = String(value ?? "");
    }
  }

  #createAdornment(hostEl: HTMLElement, isPrefix: boolean, text?: string) {
    if (!text) return;
    const el = document.createElement("p");
    el.className = isPrefix ? "prefix" : "suffix";
    el.textContent = text;
    hostEl.insertAdjacentElement(isPrefix ? "beforebegin" : "afterend", el);
  }
}

ComponentBase.register("jb-form-input", FormInput);

declare global {
  interface HTMLElementTagNameMap {
    "jb-form-input": FormInput;
  }
}
