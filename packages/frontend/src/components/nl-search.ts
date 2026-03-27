import "./form-textarea";

import { api } from "../api/api.ts";
import { FilterModel } from "../api/filterModel.ts";
import { ComponentBase } from "./componentBase.ts";
import { FORM_ELEMENT_UPDATE } from "./form-element.ts";
import type { FormTextarea } from "./form-textarea.ts";

import css from "./nl-search.css?raw";
import html from "./nl-search.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jb-nl-search";

export const NL_SEARCH_RESULT = `${tag}-result`;

/**
 * Custom element that renders a natural language search input.
 */
export class NLSearch extends ComponentBase {
  readonly #query: FormTextarea;
  readonly #update: HTMLButtonElement;
  readonly #error: HTMLElement;

  /**
   * Creates a NLSearch component instance.
   */
  constructor() {
    super(html, cssSheet);
    this.#query = this.getEl<FormTextarea>("query")!;
    this.#update = this.getEl<HTMLButtonElement>("update")!;
    this.#error = this.getEl("error")!;
  }

  override onLoad(): Promise<void> {
    const isRedirect = this.hasAttribute("redirect");

    this.#query.init({
      label: "Describe the job you want",
      name: "query",
      tooltip: isRedirect
        ? undefined
        : "Use natural language to update your filters. For example, 'A remote software engineering job posted in the last week'.",
      rows: 3,
      maxLength: 200,
    });

    this.#update.addEventListener("click", () => {
      void this.#handleUpdate();
    });

    this.listen(FORM_ELEMENT_UPDATE, () => this.#setNLUpdateState());

    if (isRedirect) {
      this.listen(NL_SEARCH_RESULT, (filters: FilterModel) =>
        this.#navigateToExplore(filters),
      );
    }

    return Promise.resolve();
  }

  #getQueryValue(): string {
    return this.#query.getAttribute("value")?.trim() ?? "";
  }

  #setNLUpdateState(): void {
    const query = this.#getQueryValue();

    if (this.#update.disabled !== !query) {
      this.#update.disabled = !query;
    }
  }

  async #handleUpdate(): Promise<void> {
    const query = this.#getQueryValue();
    if (!query) return;

    this.#query.disabled = true;
    this.#update.disabled = true;
    this.#update.textContent = "Searching...";
    this.#error.hidden = true;

    try {
      const filtersObj = await api.interpretQuery(query);
      const filters = FilterModel.fromApi(filtersObj);
      this.emit(NL_SEARCH_RESULT, filters);
      this.#query.clear();
    } catch {
      this.#error.textContent = "Failed. Please try again.";
      this.#error.hidden = false;
    } finally {
      this.#query.disabled = false;
      this.#update.textContent = "Search";
      this.#setNLUpdateState();
    }
  }

  #navigateToExplore(filters: FilterModel): void {
    const query = filters.toUrlSearchParams().toString();
    if (query) {
      window.location.assign(`/explore?${query}`);
    }
  }
}

ComponentBase.register(tag, NLSearch);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: NLSearch;
  }
}
