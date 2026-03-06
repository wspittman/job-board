import { ComponentBase } from "./componentBase";
import { FormElement, type FormElementProps } from "./form-element";

import css from "./form-textarea.css?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jb-form-textarea";

/**
 * Custom form element that wraps a textarea with standard branding and labels.
 * Extends {@link FormElement} to support multi-line text input.
 */
export class FormTextarea extends FormElement {
  /**
   * Creates an instance of the textarea element with associated styles.
   */
  constructor() {
    super("textarea", cssSheet);
  }

  /**
   * Initializes the textarea with optional rows.
   * @param props - The configuration options for the textarea component
   */
  override init({ maxLength, rows, ...rest }: FormElementProps) {
    super.init(rest);
    const intake = this.intake as HTMLTextAreaElement;

    if (rows) {
      intake.rows = rows;
    }

    if (maxLength) {
      intake.maxLength = maxLength;
    }
  }

  clear() {
    this.value = "";
    this.intake.style.height = "auto";
  }

  protected override onInput() {
    super.onInput();
    this.intake.style.height = "auto";
    this.intake.style.height = `${this.intake.scrollHeight}px`;
  }
}

ComponentBase.register(tag, FormTextarea);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: FormTextarea;
  }
}
