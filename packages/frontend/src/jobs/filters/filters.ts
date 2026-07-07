import "../../components/form-combobox";
import "../../components/form-input";
import "../../components/form-select";
import "../../components/nl-search";

import { FilterModel, type FilterModelKey } from "../../api/filterModel";
import { metadataModel } from "../../api/metadataModel";
import { Chip, CHIP_DELETE } from "../../components/chip";
import { ComponentBase } from "../../components/componentBase";
import {
  FORM_ELEMENT_UPDATE,
  type FormElement,
} from "../../components/form-element";
import { NL_SEARCH_RESULT } from "../../components/nl-search";
import {
  companyFilterDef,
  filterDefs,
  type FilterFieldDef,
} from "./filterDefs";

import css from "./filters.css?raw";
import html from "./filters.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jobs-filters";
const DEBOUNCE_DELAY = 500;

export const FILTERS_UPDATED = `${tag}-updated`;

interface Props {
  initialFilters?: FilterModel;
}

/**
 * Custom element that manages the filters pane, exposing user selections via callbacks.
 */
export class Filters extends ComponentBase {
  readonly #toggle: HTMLButtonElement;
  readonly #chips: HTMLElement;
  readonly #form: HTMLFormElement;
  readonly #inputs = new Map<FilterModelKey, FormElement>();

  #debounceTimer: number | undefined;
  #isCollapsed = false;
  #initialFilters: FilterModel | undefined;

  /**
   * Sets up the filters pane structure, event handlers, and form inputs.
   */
  constructor() {
    super(html, cssSheet, { byoc: true });
    this.#toggle = this.getEl<HTMLButtonElement>("toggle")!;
    this.#chips = this.getEl("chips")!;
    this.#form = this.getEl<HTMLFormElement>("form")!;

    this.#toggle.addEventListener("click", () => this.#handleToggle());
    this.#setCollapsed(false);
    this.#appendInputs();
  }

  /**
   * Initializes the component with callbacks and optional preset filters.
   * @param initialFilters - Filters to preload into the form inputs.
   */
  init({ initialFilters }: Props) {
    this.#initialFilters = initialFilters;

    if (this.#initialFilters && !this.#initialFilters.isEmpty()) {
      this.#setCollapsed(true);
    }
  }

  /**
   * Loads dynamic metadata and applies any initial filters once the component is connected.
   */
  protected override async onLoad() {
    this.listen(CHIP_DELETE, (key: FilterModelKey) => {
      this.#inputs.get(key)!.value = "";
    });

    this.listen(FORM_ELEMENT_UPDATE, () => this.#debounceOnChange());
    this.listen(NL_SEARCH_RESULT, (filters: FilterModel) =>
      this.#handleNLUpdate(filters),
    );

    try {
      const options = await metadataModel.getCompanyFormOptions();
      if (!this.isConnected) return;

      this.#inputs.get("companyId")?.init({
        ...companyFilterDef,
        options,
      });
    } catch {
      // ignore
    }

    if (this.#initialFilters) {
      for (const [key, value] of this.#initialFilters.toEntries()) {
        const input = this.#inputs.get(key);
        if (input) {
          input.value = value ?? "";
        }
      }
    }
  }

  #appendInputs(): void {
    const fragment = document.createDocumentFragment();

    for (const [groupLabel, defs] of filterDefs) {
      const section = document.createElement("section");
      section.className = "group";

      const heading = document.createElement("p");
      heading.className = "group-label";
      heading.textContent = groupLabel;

      const fields = document.createElement("div");
      fields.className = "group-fields";

      for (const props of defs) {
        const el = this.#createFromFilterDef(props);
        fields.append(el);
        this.#inputs.set(props.name, el);
      }

      section.append(heading, fields);
      fragment.append(section);
    }
    this.#form.append(fragment);
  }

  #createFromFilterDef(def: FilterFieldDef): FormElement {
    const el = document.createElement(def.type);
    if (def.name != "companyId") {
      el.init(def);
    }
    return el;
  }

  #debounceOnChange(): void {
    if (this.#debounceTimer) {
      window.clearTimeout(this.#debounceTimer);
    }

    this.#debounceTimer = window.setTimeout(() => {
      const data = this.#getFilterData();
      this.#renderChips(data);
      this.emit(FILTERS_UPDATED, data);
    }, DEBOUNCE_DELAY);
  }

  #getFilterData(): FilterModel {
    const formData = new FormData(this.#form);
    return FilterModel.fromFormData(formData);
  }

  #renderChips(filters: FilterModel): void {
    const fragment = document.createDocumentFragment();
    const entries = filters.toFriendlyStrings();

    for (const [key, label] of entries) {
      fragment.appendChild(
        Chip.create({
          label,
          deleteKey: key,
          filled: true,
        }),
      );
    }

    this.#chips.replaceChildren(fragment);
  }

  #handleToggle(): void {
    this.#setCollapsed(!this.#isCollapsed);
  }

  #setCollapsed(collapsed: boolean): void {
    this.#isCollapsed = collapsed;
    this.container.classList.toggle("collapsed", collapsed);
    this.#toggle.textContent = collapsed ? "\u203A" : "\u2039";
    this.#toggle.setAttribute("aria-expanded", String(!collapsed));
    this.#toggle.setAttribute(
      "aria-label",
      collapsed ? "Expand filters panel" : "Collapse filters panel",
    );
  }

  #handleNLUpdate(filters: FilterModel): void {
    for (const [key, value] of filters.toEntries()) {
      const input = this.#inputs.get(key);
      if (input) {
        input.value = value ?? "";
      }
    }

    this.#debounceOnChange();
  }
}

ComponentBase.register(tag, Filters);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Filters;
  }
}
