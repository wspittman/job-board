import { ComponentBase } from "./componentBase";

import css from "./chip.css?raw";
import html from "./chip.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jb-chip";

interface Props {
  label: string;
  onDelete?: () => void;
  filled?: boolean;
}

/**
 * Compact visual element that displays a label with an optional delete action.
 * The chip renders using shared component base styles and supports a filled variant.
 */
export class Chip extends ComponentBase {
  /**
   * Creates a chip element instance with shared styling applied.
   */
  constructor() {
    super(html, cssSheet);
  }

  /**
   * Creates a chip element with the provided configuration.
   * @param label - Text to display within the chip body
   * @param onDelete - Optional callback invoked when the delete button is clicked
   * @param filled - Whether to render the chip using the filled visual style
   * @returns A fully configured chip custom element ready for insertion
   */
  static create({ label, onDelete, filled }: Props) {
    const element = document.createElement(tag);
    element.setText("label", label);

    if (filled) {
      element.getEl("container")!.classList.add("filled");
    }

    if (onDelete) {
      const deleteBtn = element.getEl<HTMLButtonElement>("delete")!;
      deleteBtn.style.display = "inline-flex";
      deleteBtn.onclick = () => {
        element.hide();
        onDelete();
      };
    }

    return element;
  }
}

ComponentBase.register(tag, Chip);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Chip;
  }
}
