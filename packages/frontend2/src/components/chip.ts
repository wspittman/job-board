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

export class Chip extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

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
