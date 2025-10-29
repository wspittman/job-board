import { ComponentBase } from "./componentBase";
import css from "./form-input.css?raw";
import html from "./form-input.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

interface Props {
  label: string;
  name: string;
  onChange?: () => void;
  prefix?: string;
  suffix?: string;

  // editable
  value?: unknown;
}

export class FormInput extends ComponentBase {
  static formAssociated = true;

  #internals = this.attachInternals();
  #input!: HTMLInputElement;

  static get observedAttributes() {
    return ["name", "value"];
  }

  constructor() {
    super(html, cssSheet);
    this.#input = this.getEl<HTMLInputElement>("input")!;

    // Keep the external form value attribute in sync with the internal input value
    this.#input.addEventListener("input", () => this.#syncAttribute());
  }

  init({ label, name, onChange, prefix, suffix, value }: Props) {
    this.setManyTexts({ label, legend: label });

    this.setAttribute("name", name);
    this.value = value;
    this.#input.onchange = () => onChange?.();
    this.#input.oninput = () => onChange?.();
    this.#createAdornment(true, prefix);
    this.#createAdornment(false, suffix);
  }

  set value(value: unknown) {
    this.#input.value = String(value ?? "");
    this.#syncAttribute();
  }

  #syncAttribute() {
    this.setAttribute("value", this.#input.value);
    this.#internals.setFormValue(this.#input.value);
  }

  #createAdornment(isPrefix: boolean, text?: string) {
    if (!text) return;
    const el = document.createElement("p");
    el.className = isPrefix ? "prefix" : "suffix";
    el.textContent = text;
    this.#input.insertAdjacentElement(
      isPrefix ? "beforebegin" : "afterend",
      el
    );
  }
}

ComponentBase.register("jb-form-input", FormInput);

declare global {
  interface HTMLElementTagNameMap {
    "jb-form-input": FormInput;
  }
}
