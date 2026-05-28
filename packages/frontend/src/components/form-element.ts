import { ComponentBase } from "./componentBase";
import css from "./form-element.css?raw";
import html from "./form-element.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

export const FORM_ELEMENT_UPDATE = "jb-form-element-update";

export type FormValue = string | number | boolean | undefined;

export interface FormOption {
  label: string;
  value: FormValue;
}

export interface FormElementProps {
  label: string;
  name: string;
  tooltip?: string;

  // For input and textarea
  maxLength?: number;

  // For input
  prefix?: string;
  suffix?: string;
  validation?: {
    type: "int";
    min?: number;
    max?: number;
  };

  // For textarea
  rows?: number;

  // For select and combobox
  options?: FormOption[];

  // editable
  value?: FormValue;
}

/**
 * Shared base class for form-associated custom elements that wrap native inputs.
 * Handles label rendering, attribute synchronization, and form value management.
 */
export abstract class FormElement extends ComponentBase {
  static formAssociated = true;

  protected intake!: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  #internals = this.attachInternals();

  /**
   * Returns the list of attributes that trigger attributeChangedCallback.
   * Ensures name and value stay in sync between internal and external state.
   */
  static get observedAttributes() {
    return ["name", "value"];
  }

  /**
   * Constructs a form element wrapper with the specified input type and styles.
   * @param intakeType - The native element type to create within the component
   * @param css - The component-specific stylesheet to adopt
   */
  constructor(intakeType: "input" | "select" | "textarea", css: CSSStyleSheet) {
    super(html, [cssSheet, css]);

    this.intake = document.createElement(intakeType);
    this.intake.id = "intake";
    this.intake.className = "intake";

    if (intakeType === "input" || intakeType === "textarea") {
      this.intake.setAttribute("placeholder", " ");
    }

    if (intakeType === "input") {
      this.intake.setAttribute("type", "text");
    }

    this.getEl("intake-wrap")!.prepend(this.intake);

    // Keep the external form value attribute in sync with the internal input value
    this.addEventListener("input", () => this.onInput());

    this.intake.addEventListener("focus", () =>
      this.container.classList.add("has-focus"),
    );
    this.intake.addEventListener("blur", () =>
      this.container.classList.remove("has-focus"),
    );
  }

  /**
   * Initializes the component's public state and wiring.
   * @param props - Incoming configuration values for the element
   */
  init({ label, name, tooltip, value }: FormElementProps) {
    this.setManyTexts({ label, legend: label, tooltip });
    this.setAttribute("name", name);
    this.value = value;
    if (tooltip) {
      this.getEl("help")!.removeAttribute("hidden");
    }
  }

  /**
   * Updates the externally visible value while keeping form internals aligned.
   * @param value - The new value to display within the intake element
   */
  set value(value: FormValue) {
    this.intake.value = String(value ?? "");
    this.#syncAttribute();
  }

  set disabled(isDisabled: boolean) {
    if (isDisabled) {
      this.intake.setAttribute("disabled", "true");
    } else {
      this.intake.removeAttribute("disabled");
    }
  }

  /**
   * Retrieves the value that should be submitted with the form.
   * Subclasses may override to provide custom representations.
   */
  protected getFormValue() {
    return this.intake.value;
  }

  /**
   * Handles native input/change events by syncing state back to attributes.
   */
  protected onInput() {
    this.#syncAttribute();
  }

  protected setElHasValue(hasValue: boolean) {
    this.container.classList.toggle("has-value", hasValue);
  }

  #syncAttribute() {
    this.setElHasValue(!!this.intake.value);
    const formValue = this.getFormValue();
    this.setAttribute("value", formValue);
    this.#internals.setFormValue(formValue);
    this.emit(FORM_ELEMENT_UPDATE, formValue);
  }
}
