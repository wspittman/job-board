import { RESET } from "./reset.ts";
import "./stat-card-area.css";
import css from "./stat-card-area.css?raw";
import html from "./stat-card-area.html?raw";

const SHEET = new CSSStyleSheet();
SHEET.replaceSync(css);

class StatCardAreaElement extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [...RESET, SHEET];
    root.innerHTML = html;
  }
}

if (!customElements.get("stat-card-area")) {
  customElements.define("stat-card-area", StatCardAreaElement);
}
