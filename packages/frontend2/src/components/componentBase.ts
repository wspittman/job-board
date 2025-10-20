import norm from "modern-normalize/modern-normalize.css?raw";
import parts from "../sharedStyles/parts.css?raw";

export abstract class ComponentBase extends HTMLElement {
  static #normSheet = ComponentBase.createCSSSheet(norm);
  static #partsSheet = ComponentBase.createCSSSheet(parts);

  protected root: ShadowRoot;

  constructor(html: string, css: CSSStyleSheet, omitPartsCss: boolean = false) {
    super();
    this.root = this.attachShadow({ mode: "open" });

    const sheets = [ComponentBase.#normSheet];
    if (!omitPartsCss) {
      sheets.push(ComponentBase.#partsSheet);
    }
    sheets.push(css);
    this.root.adoptedStyleSheets = sheets;
    this.root.innerHTML = html;
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

  protected getEl<T extends HTMLElement>(id: string): T | null {
    return this.root.getElementById(id) as T | null;
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
