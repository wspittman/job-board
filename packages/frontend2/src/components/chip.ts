import css from "./chip.css?raw";
import html from "./chip.html?raw";
import { ComponentBase } from "./componentBase";

const cssSheet = ComponentBase.createCSSSheet(css);

interface Props {
  label: string;
  onDelete?: () => void;
  filled?: boolean;
}

export class Chip extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

  init({ label, onDelete, filled }: Props) {
    this.setText("label", label);

    if (filled) {
      this.getEl("container")!.classList.add("filled");
    }

    if (onDelete) {
      const deleteBtn = this.getEl<HTMLButtonElement>("delete")!;
      deleteBtn.style.display = "inline-flex";
      deleteBtn.onclick = () => {
        this.hide();
        onDelete();
      };
    }
  }
}

ComponentBase.register("jb-chip", Chip);

declare global {
  interface HTMLElementTagNameMap {
    "jb-chip": Chip;
  }
}
