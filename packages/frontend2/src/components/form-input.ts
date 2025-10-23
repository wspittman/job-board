import { ComponentBase } from "./componentBase";
import css from "./form-input.css?raw";
import html from "./form-input.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

interface Props {
  // init-only
  label: string;
  name: string;
  onChange?: (value: unknown) => void;
  prefix?: string;
  suffix?: string;

  // editable
  value?: unknown;
}

export class FormInput extends ComponentBase {
  #value: unknown;

  constructor() {
    super(html, cssSheet);
  }

  init({ label, name, onChange, prefix, suffix, value }: Props) {
    this.setText("label", label);
    this.setText("legend", label);

    const inputEl = this.getEl<HTMLInputElement>("input");
    if (inputEl) {
      inputEl.name = name;
      inputEl.value = String(value ?? "");
      inputEl.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        this.#value = target.value;
        onChange?.(this.#value);
      };

      this.#createAdornment(inputEl, true, prefix);
      this.#createAdornment(inputEl, false, suffix);
    }
  }

  set value(value: unknown) {
    this.#value = value;
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

ComponentBase.register("form-input", FormInput);
