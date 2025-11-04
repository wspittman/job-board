import { ComponentBase } from "./componentBase";
import css from "./form-element.css?raw";
import html from "./form-element.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

export interface FormOption {
  label: string;
  value: unknown;
}

export interface FormElementProps {
  label: string;
  name: string;
  onChange?: () => void;

  // For input
  prefix?: string;
  suffix?: string;
  validation?: {
    type: "numeric";
    min?: number;
    max?: number;
  };

  // For select and combobox
  options?: FormOption[];

  // editable
  value?: unknown;
}

export abstract class FormElement extends ComponentBase {
  static formAssociated = true;

  protected intake!: HTMLInputElement | HTMLSelectElement;
  #internals = this.attachInternals();
  #onChange?: () => void;

  static get observedAttributes() {
    return ["name", "value"];
  }

  constructor(intakeType: "input" | "select", css: CSSStyleSheet) {
    super(html, [cssSheet, css]);

    this.intake = document.createElement(intakeType);
    this.intake.id = "intake";
    this.intake.className = "intake";

    if (intakeType === "input") {
      this.intake.setAttribute("type", "text");
      this.intake.setAttribute("placeholder", " ");
    }

    this.getEl("intake-wrap")!.prepend(this.intake);

    // Keep the external form value attribute in sync with the internal input value
    const update = () => this.onInput();
    this.intake.addEventListener("input", update);
    this.intake.addEventListener("change", update);
  }

  init({ label, name, onChange, value }: FormElementProps) {
    this.#onChange = onChange;
    this.setManyTexts({ label, legend: label });
    this.setAttribute("name", name);
    this.value = value;
  }

  set value(value: unknown) {
    this.intake.value = String(value ?? "");
    this.#syncAttribute();
  }

  protected getFormValue() {
    return this.intake.value;
  }

  protected onInput() {
    this.#syncAttribute();
  }

  #syncAttribute() {
    this.intake.classList.toggle("has-value", !!this.intake.value);
    const formValue = this.getFormValue();
    this.setAttribute("value", formValue);
    this.#internals.setFormValue(formValue);
    this.#onChange?.();
  }
}
