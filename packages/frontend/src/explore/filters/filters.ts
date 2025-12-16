import "../../components/form-combobox";
import "../../components/form-input";
import "../../components/form-select";

import {
  currencyOptions,
  jobFamilyOptions,
  payCadenceOptions,
  workTimeBasisOptions,
} from "../../api/apiEnums";
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
  onChange?: (filters: FilterModel) => Promise<void>;
}

interface FormElementDef extends FormElementProps {
  type: "jb-form-input" | "jb-form-select" | "jb-form-combobox";
}

const filterDefs: Record<string, FormElementDef[]> = {
  "The Work": [
    {
      type: "jb-form-input",
      name: "title",
      label: "Title",
      tooltip:
        "A partial match search on job title text, so 'port' will match 'Support Engineer' and 'Portfolio Manager'.",
    },
    {
      type: "jb-form-combobox",
      name: "companyId",
      label: "Company",
    },
    {
      type: "jb-form-select",
      name: "workTimeBasis",
      label: "Hours",
      options: workTimeBasisOptions,
    },
    {
      type: "jb-form-select",
      name: "jobFamily",
      label: "Job Family",
      tooltip:
        "A broad categorization of the job's primary function. Some jobs can be difficult to categorize, so leave this empty if your target role spans multiple functions.",
      options: jobFamilyOptions,
    },
  ],
  "The Compensation": [
    {
      type: "jb-form-select",
      name: "payCadence",
      label: "Pay Basis",
      options: payCadenceOptions,
    },
    {
      type: "jb-form-select",
      name: "currency",
      label: "Currency",
      options: currencyOptions,
    },
    {
      type: "jb-form-input",
      name: "minSalary",
      label: "Minimum Rate",
      tooltip:
        "Ignores currency symbols. We'll be working to improve controls here in the future.",
      prefix: "$",
      validation: {
        type: "int",
        min: 0,
        max: 9_999_999,
      },
    },
  ],
  Other: [
    {
      type: "jb-form-select",
      name: "isRemote",
      label: "Remote",
      options: [
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
      tooltip:
        "Filters to jobs posted within the specified number of days. Some data source only provide last updated date, so we use the earliest date we've seen.",
      prefix: "Posted within",
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
  ],
} as const;

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
  #onChange?: (filters: FilterModel) => Promise<void>;
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

      const def = filterDefs["The Work"]?.find(
        (def) => def.name === "companyId",
      );
      if (!def) return;

      this.#inputs.get("companyId")?.init({
        ...def,
        options,
        onChange: () => this.#debounceOnChange(),
      });
    } catch {
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

    for (const [groupLabel, defs] of Object.entries(filterDefs)) {
      const section = document.createElement("section");
      section.className = "group";

      const heading = document.createElement("p");
      heading.className = "group-label";
      heading.textContent = groupLabel;

      const fields = document.createElement("div");
      fields.className = "group-fields";

      for (const props of defs) {
        const el = this.#createFromFilterDef({ ...props, onChange });
        fields.append(el);
        this.#inputs.set(props.name as FilterModelKey, el);
      }

      section.append(heading, fields);
      fragment.append(section);
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
      window.clearTimeout(this.#debounceTimer);
    }

    this.#debounceTimer = window.setTimeout(() => {
      const data = this.#getFilterData();
      this.#renderChips(data);
      void this.#onChange?.(data);
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
          onDelete: () => (this.#inputs.get(key)!.value = ""),
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
    this.#container.classList.toggle("collapsed", collapsed);
    this.#toggle.textContent = collapsed ? "\u203A" : "\u2039";
    this.#toggle.setAttribute("aria-expanded", String(!collapsed));
    this.#toggle.setAttribute(
      "aria-label",
      collapsed ? "Expand filters panel" : "Collapse filters panel",
    );
  }
}

ComponentBase.register(tag, Filters);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Filters;
  }
}
