import norm from "modern-normalize/modern-normalize.css?raw";
import parts from "../sharedStyles/parts.css?raw";

export abstract class ComponentBase extends HTMLElement {
  static #normSheet = ComponentBase.createCSSSheet(norm);
  static #partsSheet = ComponentBase.createCSSSheet(parts);

  protected root: ShadowRoot;

  constructor(css: CSSStyleSheet, initialHtml: string) {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.adoptedStyleSheets = [
      ComponentBase.#normSheet,
      ComponentBase.#partsSheet,
      css,
    ];
    this.root.innerHTML = initialHtml;
  }

  protected hide() {
    this.style.display = "none";
  }

  protected show() {
    this.style.display = "block";
  }

  protected setText(id: string, value: string = "") {
    const el = this.getEl(id);
    if (el) el.textContent = value;
  }

  protected getEl(id: string): HTMLElement | null {
    return this.root.getElementById(id);
  }

  static register(tag: string, element: typeof HTMLElement) {
    if (!customElements.get(tag)) {
      customElements.define(tag, element);
    }
  }

  static createCSSSheet(css: string): CSSStyleSheet {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return sheet;
  }
}
