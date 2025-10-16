import { api } from "../api/api.ts";
import "./stat-card-area.css";
import css from "./stat-card-area.css?raw";
import html from "./stat-card-area.html?raw";
import { componentCssReset, setDisplay, setText } from "./utils.ts";

const cssSheet = new CSSStyleSheet();
cssSheet.replaceSync(css);

class StatCardAreaElement extends HTMLElement {
  #root: ShadowRoot;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.adoptedStyleSheets = [...componentCssReset, cssSheet];
    this.#root.innerHTML = html;
  }

  connectedCallback() {
    this.#load();
  }

  async #load() {
    try {
      const data = await api.fetchMetadata();
      if (!this.isConnected) return;

      setText(this.#root, "#job-count", String(data.jobCount));
      setText(this.#root, "#company-count", String(data.companyCount));
      setDisplay(this.#root, ".stats", "grid");
    } catch (err: any) {}
  }
}

if (!customElements.get("stat-card-area")) {
  customElements.define("stat-card-area", StatCardAreaElement);
}
