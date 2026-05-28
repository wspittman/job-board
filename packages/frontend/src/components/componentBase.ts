import norm from "modern-normalize/modern-normalize.css?raw";
import parts from "../sharedStyles/parts.css?raw";

interface Options {
  omitPartsCss?: boolean;
  byoc?: boolean;
}

/**
 * Base class for custom web components that use Shadow DOM.
 * Automatically includes normalize CSS and optional shared parts CSS in all derived components.
 */
export abstract class ComponentBase extends HTMLElement {
  static readonly #normSheet = ComponentBase.createCSSSheet(norm);
  static readonly #partsSheet = ComponentBase.createCSSSheet(parts);

  protected readonly root: ShadowRoot;
  protected readonly container: HTMLElement;

  /**
   * Creates a new component with Shadow DOM.
   * By default, the HTML content is rendered inside a container div (class="container").
   * @param html The HTML content
   * @param css The component-specific CSS stylesheet
   * @param options Configuration options for the component
   */
  constructor(
    html: string,
    css: CSSStyleSheet | CSSStyleSheet[],
    options: Options = {},
  ) {
    const cssSheets = Array.isArray(css) ? css : [css];
    const { omitPartsCss, byoc } = options;

    super();
    this.root = this.attachShadow({ mode: "open" });

    const sheets = omitPartsCss
      ? [ComponentBase.#normSheet, ...cssSheets]
      : [ComponentBase.#normSheet, ComponentBase.#partsSheet, ...cssSheets];
    this.root.adoptedStyleSheets = sheets;

    if (byoc) {
      this.root.innerHTML = html;
      this.container = this.root.firstElementChild as HTMLElement;
    } else {
      this.container = document.createElement("div");
      this.container.innerHTML = html;
      this.root.appendChild(this.container);
    }

    this.container.classList.add("container");
  }

  /**
   * Lifecycle hook called when the component is connected to the DOM.
   * Override this method in derived classes to perform logic on DOM insertion.
   */
  protected onLoad(): Promise<void> {
    return Promise.resolve();
  }

  // #region Element Actions

  /**
   * Sets the text content of multiple elements by their IDs.
   * @param values - A map of element IDs to their text values
   */
  protected setManyTexts(values: Record<string, string | undefined>) {
    for (const [id, value] of Object.entries(values)) {
      this.setText(id, value);
    }
  }

  /**
   * Sets the text content of an element by its ID.
   * @param id - The ID of the element within the shadow root
   * @param value - The text content to set (defaults to empty string)
   */
  protected setText(id: string, value: string = "") {
    const el = this.getEl(id);
    if (el) el.textContent = value;
  }

  /**
   * Gets an element from the shadow root by its ID.
   * @param id - The ID of the element to retrieve
   * @returns The element cast to the specified type, or null if not found
   */
  protected getEl<T extends HTMLElement>(id: string): T | null {
    return this.root.getElementById(id) as T | null;
  }

  /**
   * Dispatches a bubbling custom event from the host element.
   * @param type - Event name exposed by the component
   * @param detail - Optional payload included with the event
   */
  protected emit(type: string, detail?: unknown): void {
    this.dispatchEvent(
      new CustomEvent(type, { bubbles: true, composed: true, detail }),
    );
  }

  /**
   * Adds an event listener for a custom event type, with a typed detail payload.
   * @param type - The custom event name to listen for
   * @param fn - Callback function invoked with the event detail when the event is fired
   */
  protected listen<T>(type: string, fn: (detail: T) => void) {
    this.addEventListener(type, (event) => {
      if (event instanceof CustomEvent) {
        fn(event.detail as T);
      }
    });
  }

  // #endregion

  // #region Static Methods

  /**
   * Registers a custom element with the given tag name.
   * Only registers if the tag is not already defined.
   * @param tag - The custom element tag name (must contain a hyphen)
   * @param element - The custom element constructor
   */
  static register(tag: string, element: typeof HTMLElement) {
    if (!customElements.get(tag)) {
      customElements.define(tag, element);
    }
  }

  /**
   * Creates a CSSStyleSheet from a CSS string.
   * @param css - The CSS content as a string
   * @returns A constructed CSSStyleSheet ready for adoption
   */
  static createCSSSheet(css: string): CSSStyleSheet {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return sheet;
  }

  // #endregion

  /**
   * Called when the element is inserted into the DOM.
   * Triggers the onLoad lifecycle hook.
   */
  connectedCallback() {
    void this.onLoad();
  }
}
