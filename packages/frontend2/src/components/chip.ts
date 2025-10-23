import css from "./chip.css?raw";
import { ComponentBase } from "./componentBase";

const cssSheet = ComponentBase.createCSSSheet(css);

interface Props {
  // init-only
  label: string;
  onDelete?: () => void;
}

export class Chip extends ComponentBase {
  constructor() {
    super("<span id='container' class='container'></span>", cssSheet);
  }

  init({ label, onDelete }: Props) {
    this.setText("container", label);
    this.setOnClick("container", onDelete);
  }
}

ComponentBase.register("jb-chip", Chip);

declare global {
  interface HTMLElementTagNameMap {
    "jb-chip": Chip;
  }
}
