import "../../components/form-textarea";

import { api } from "../../api/api.ts";
import { FilterModel } from "../../api/filterModel.ts";
import { ComponentBase } from "../../components/componentBase.ts";
import type { FormTextarea } from "../../components/form-textarea.ts";

import css from "./nl-search.css?raw";
import html from "./nl-search.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "filters-nl-search";

interface Props {
  onFilters: (filters: FilterModel) => void;
}

/**
 * Custom element that renders a natural language search input.
 */
export class NLSearch extends ComponentBase {
  readonly #query: FormTextarea;
  readonly #update: HTMLButtonElement;
  readonly #error: HTMLElement;
  #onFilters?: (filters: FilterModel) => void;

  /**
   * Applies the job card template and default styles to the element instance.
   */
  constructor() {
    super(html, cssSheet);
    this.#query = this.getEl<FormTextarea>("query")!;
    this.#update = this.getEl<HTMLButtonElement>("update")!;
    this.#error = this.getEl("error")!;
  }

  /**
   * Sets up the filter accessors
   * @param onFilters - Function that accepts an updated filter state to apply
   */
  init({ onFilters }: Props) {
    this.#onFilters = onFilters;

    this.#query.init({
      label: "Describe the job you want",
      name: "query",
      tooltip:
        "Use natural language to update your filters. For example, 'A remote software engineering job posted in the last week'.",
      rows: 3,
      maxLength: 200,
      onChange: () => this.#setNLUpdateState(),
    });

    this.#update.addEventListener("click", () => {
      void this.#handleUpdate();
    });
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
    if (!query || !this.#onFilters) return;

    this.#update.disabled = true;
    this.#update.textContent = "Updating...";
    this.#error.hidden = true;

    try {
      const filtersObj = await api.interpretQuery(query);
      const filters = FilterModel.fromApi(filtersObj);
      this.#onFilters(filters);
      this.#query.clear();
    } catch {
      this.#error.textContent = "Failed. Please try again.";
      this.#error.hidden = false;
    } finally {
      this.#update.disabled = false;
      this.#update.textContent = "Update";
    }
  }
}

ComponentBase.register(tag, NLSearch);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: NLSearch;
  }
}
