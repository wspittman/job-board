import { FilterModel, type FilterModelKey } from "../../api/filterModel";
import "../../components/chip";
import { ComponentBase } from "../../components/componentBase";
import type { FormElement } from "../../components/form-element";
import "../../components/form-input";
import type { FormInputProps } from "../../components/form-input";
import "../../components/form-select";
import type { FormSelectProps } from "../../components/form-select";
import css from "./filters.css?raw";
import html from "./filters.html?raw";

const tag = "explore-filters";
const cssSheet = ComponentBase.createCSSSheet(css);
const DEBOUNCE_DELAY = 500;

interface Props {
  initialFilters?: FilterModel;
  onChange?: (filters: FilterModel) => void;
}

interface FormInputDef extends FormInputProps {
  type: "input";
}

interface FormSelectDef extends FormSelectProps {
  type: "select";
}

const filterDefs: (FormInputDef | FormSelectDef)[] = [
  {
    type: "input",
    name: "title",
    label: "Title",
  },
  {
    type: "select",
    name: "isRemote",
    label: "Remote",
    options: [
      { label: "", value: "" },
      { label: "Remote", value: "true" },
      { label: "In-Person / Hybrid", value: "false" },
    ],
  },
  {
    type: "input",
    name: "location",
    label: "Location",
    prefix: "Working from",
  },
  {
    type: "input",
    name: "minSalary",
    label: "Minimum Salary",
    prefix: "$",
  },
  {
    type: "input",
    name: "maxExperience",
    label: "Required Experience",
    prefix: "I have at least",
    suffix: "years experience",
  },
  {
    type: "input",
    name: "daysSince",
    label: "Posted Since",
    suffix: "days ago",
  },
];

export class Filters extends ComponentBase {
  readonly #container: HTMLElement;
  readonly #toggle: HTMLButtonElement;
  readonly #chips: HTMLElement;
  readonly #form: HTMLFormElement;
  readonly #inputs = new Map<FilterModelKey, FormElement>();

  #debounceTimer: number | undefined;
  #onChange?: (filters: FilterModel) => void;
  #isCollapsed = false;

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

  init({ onChange, initialFilters }: Props) {
    this.#onChange = onChange;

    if (initialFilters && !initialFilters.isEmpty()) {
      for (const [key, value] of initialFilters.toEntries()) {
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

  #createFromFilterDef(def: FormInputDef | FormSelectDef): FormElement {
    if (def.type === "select") {
      const el = document.createElement("jb-form-select");
      el.init(def);
      return el;
    }

    const el = document.createElement("jb-form-input");
    el.init(def);
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

  #renderChips(filters: FilterModel): void {
    const fragment = document.createDocumentFragment();
    const entries = filters.toFriendlyStrings();

    for (const [key, label] of entries) {
      const chip = document.createElement("jb-chip");
      chip.init({
        label,
        onDelete: () => (this.#inputs.get(key)!.value = ""),
        filled: true,
      });
      fragment.appendChild(chip);
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
