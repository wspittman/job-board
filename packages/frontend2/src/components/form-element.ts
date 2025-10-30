import { ComponentBase } from "./componentBase";
import css from "./form-element.css?raw";
import html from "./form-element.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

export interface FormElementProps {
  label: string;
  name: string;
  onChange?: () => void;

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
    this.getEl("intake-wrap")!.prepend(this.intake);

    // Keep the external form value attribute in sync with the internal input value
    const update = () => this.#syncAttribute();
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

  #syncAttribute() {
    this.intake.classList.toggle("has-value", !!this.intake.value);
    this.setAttribute("value", this.intake.value);
    this.#internals.setFormValue(this.intake.value);
    this.#onChange?.();
  }
}
