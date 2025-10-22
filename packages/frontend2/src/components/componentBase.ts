import norm from "modern-normalize/modern-normalize.css?raw";
import parts from "../sharedStyles/parts.css?raw";

interface Options {
  omitPartsCss?: boolean;
}

export abstract class ComponentBase extends HTMLElement {
  static #normSheet = ComponentBase.createCSSSheet(norm);
  static #partsSheet = ComponentBase.createCSSSheet(parts);

  protected root: ShadowRoot;

  constructor(html: string, css: CSSStyleSheet, options: Options = {}) {
    const { omitPartsCss = false } = options;

    super();
    this.root = this.attachShadow({ mode: "open" });

    const sheets = omitPartsCss
      ? [ComponentBase.#normSheet, css]
      : [ComponentBase.#normSheet, ComponentBase.#partsSheet, css];
    this.root.adoptedStyleSheets = sheets;

    this.root.innerHTML = html;
  }

  connectedCallback() {
    this.onLoad();
  }

  protected onLoad(): void {}

  protected hide() {
    this.style.display = "none";
  }

  protected show() {
    this.style.display = "block";
  }

  protected setManyTexts(values: Record<string, string | undefined>) {
    for (const [id, value] of Object.entries(values)) {
      this.setText(id, value);
    }
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
