import "../../components/form-combobox";
import "../../components/form-input";
import "../../components/form-select";

import { FilterModel, type FilterModelKey } from "../../api/filterModel";
import { metadataModel } from "../../api/metadataModel";
import { Chip } from "../../components/chip";
import { ComponentBase } from "../../components/componentBase";
import type {
  FormElement,
  FormElementProps,
} from "../../components/form-element";

import css from "./filters.css?raw";
import html from "./filters.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "explore-filters";
const DEBOUNCE_DELAY = 500;

interface Props {
  initialFilters?: FilterModel;
  onChange?: (filters: FilterModel) => void;
}

interface FormElementDef extends FormElementProps {
  type: "jb-form-input" | "jb-form-select" | "jb-form-combobox";
}

const filterDefs: FormElementDef[] = [
  {
    type: "jb-form-input",
    name: "title",
    label: "Title",
  },
  {
    type: "jb-form-combobox",
    name: "companyId",
    label: "Company",
  },
  {
    type: "jb-form-select",
    name: "isRemote",
    label: "Remote",
    options: [
      { label: "", value: "" },
      { label: "Remote", value: "true" },
      { label: "In-Person / Hybrid", value: "false" },
    ],
  },
  {
    type: "jb-form-input",
    name: "location",
    label: "Location",
    prefix: "Working from",
  },
  {
    type: "jb-form-input",
    name: "minSalary",
    label: "Minimum Salary",
    prefix: "$",
    validation: {
      type: "int",
      min: 0,
      max: 9_999_999,
    },
  },
  {
    type: "jb-form-input",
    name: "maxExperience",
    label: "Required Experience",
    prefix: "I have",
    suffix: "years experience",
    validation: {
      type: "int",
      min: 0,
      max: 99,
    },
  },
  {
    type: "jb-form-input",
    name: "daysSince",
    label: "Posted Since",
    suffix: "days ago",
    validation: {
      type: "int",
      min: 1,
      max: 999,
    },
  },
  {
    // Hidden via CSS
    type: "jb-form-input",
    name: "jobId",
    label: "Job ID",
  },
];

/**
 * Custom element that manages the filters pane, exposing user selections via callbacks.
 */
export class Filters extends ComponentBase {
  readonly #container: HTMLElement;
  readonly #toggle: HTMLButtonElement;
  readonly #chips: HTMLElement;
  readonly #form: HTMLFormElement;
  readonly #inputs = new Map<FilterModelKey, FormElement>();

  #debounceTimer: number | undefined;
  #onChange?: (filters: FilterModel) => void;
  #isCollapsed = false;
  #initialFilters: FilterModel | undefined;

  /**
   * Sets up the filters pane structure, event handlers, and form inputs.
   */
  constructor() {
    super(html, cssSheet);
    this.#container = this.getEl("container")!;
    this.#toggle = this.getEl<HTMLButtonElement>("toggle")!;
    this.#form = this.getEl<HTMLFormElement>("form")!;
    this.#chips = this.getEl("chips")!;

    this.#toggle.addEventListener("click", () => this.#handleToggle());
    this.#setCollapsed(false);
    this.#appendInputs();
  }

  /**
   * Initializes the component with callbacks and optional preset filters.
   * @param onChange - Callback fired after debounced filter updates.
   * @param initialFilters - Filters to preload into the form inputs.
   */
  init({ onChange, initialFilters }: Props) {
    this.#onChange = onChange;
    this.#initialFilters = initialFilters;

    if (this.#initialFilters && !this.#initialFilters.isEmpty()) {
      this.#setCollapsed(true);
    }
  }

  /**
   * Loads dynamic metadata and applies any initial filters once the component is connected.
   */
  protected override async onLoad() {
    try {
      const options = await metadataModel.getCompanyFormOptions();
      if (!this.isConnected) return;

      const def = filterDefs.find((def) => def.name === "companyId");
      if (!def) return;

      this.#inputs.get("companyId")?.init({
        ...def,
        options,
        onChange: () => this.#debounceOnChange(),
      });
    } catch (err) {
      // ignore
    }

    if (this.#initialFilters && !this.#initialFilters.isEmpty()) {
      for (const [key, value] of this.#initialFilters.toEntries()) {
        const input = this.#inputs.get(key);
        if (input) {
          input.value = value ?? "";
        }
      }
    }
  }

  #appendInputs(): void {
    const onChange = () => this.#debounceOnChange();
    const fragment = document.createDocumentFragment();
    for (const props of filterDefs) {
      const el = this.#createFromFilterDef({ ...props, onChange });
      fragment.append(el);
      this.#inputs.set(props.name as FilterModelKey, el);
    }
    this.#form.append(fragment);
  }

  #createFromFilterDef(def: FormElementDef): FormElement {
    const el = document.createElement(def.type);
    if (def.name != "companyId") {
      el.init(def);
    }
    return el;
  }

  #debounceOnChange(): void {
    if (!this.#onChange) return;

    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
    }

    this.#debounceTimer = window.setTimeout(() => {
      const data = this.#getFilterData();
      this.#onChange?.(data);
      this.#renderChips(data);
    }, DEBOUNCE_DELAY);
  }

  #getFilterData(): FilterModel {
    const formData = new FormData(this.#form);
    return FilterModel.fromFormData(formData);
  }

  async #renderChips(filters: FilterModel): Promise<void> {
    const fragment = document.createDocumentFragment();
    const entries = await filters.toFriendlyStrings();

    for (const [key, label] of entries) {
      fragment.appendChild(
        Chip.create({
          label,
          onDelete: () => (this.#inputs.get(key)!.value = ""),
          filled: true,
        })
      );
    }

    this.#chips.replaceChildren(fragment);
  }

  #handleToggle(): void {
    this.#setCollapsed(!this.#isCollapsed);
  }

  #setCollapsed(collapsed: boolean): void {
    this.#isCollapsed = collapsed;
    this.#container.classList.toggle("collapsed", collapsed);
    this.#toggle.textContent = collapsed ? "\u203A" : "\u2039";
    this.#toggle.setAttribute("aria-expanded", String(!collapsed));
    this.#toggle.setAttribute(
      "aria-label",
      collapsed ? "Expand filters panel" : "Collapse filters panel"
    );
  }
}

ComponentBase.register(tag, Filters);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Filters;
  }
}
