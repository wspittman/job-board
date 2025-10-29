import type { FilterModel } from "../../api/apiTypes";
import { formDataToFilterModel } from "../../api/filterModelUtils";
import "../../components/chip";
import { ComponentBase } from "../../components/componentBase";
import "../../components/form-input";
import type { FormInput } from "../../components/form-input";
import css from "./filters.css?raw";
import html from "./filters.html?raw";

const tag = "explore-filters";
const cssSheet = ComponentBase.createCSSSheet(css);
const DEBOUNCE_DELAY = 500;

interface Props {
  onChange?: (filters: FilterModel) => void;
}

type FormInputProps = Parameters<FormInput["init"]>[0];

export class Filters extends ComponentBase {
  readonly #form: HTMLFormElement;
  readonly #chips: HTMLElement;
  readonly #inputs = new Map<keyof FilterModel, FormInput>();
  #debounceTimer: number | undefined;
  #onChange?: (filters: FilterModel) => void;

  constructor() {
    super(html, cssSheet);
    this.#form = this.getEl<HTMLFormElement>("form")!;
    this.#chips = this.getEl<HTMLElement>("chips")!;

    this.#appendInputs(
      {
        label: "Title",
        name: "title",
      },
      {
        label: "Location",
        name: "location",
        prefix: "Working from",
      },
      {
        label: "Minimum Salary",
        name: "minSalary",
        prefix: "$",
      },
      {
        label: "Required Experience",
        name: "maxExperience",
        prefix: "I have at least",
        suffix: "years experience",
      },
      {
        label: "Posted Since",
        name: "daysSince",
        suffix: "days ago",
      }
    );
  }

  init({ onChange }: Props) {
    this.#onChange = onChange;
  }

  #appendInputs(...defs: FormInputProps[]): void {
    const onChange = () => this.#debounceOnChange();
    const fragment = document.createDocumentFragment();
    for (const props of defs) {
      const el = document.createElement("jb-form-input");
      el.init({ ...props, onChange });
      fragment.append(el);
      this.#inputs.set(props.name as keyof FilterModel, el);
    }
    this.#form.append(fragment);
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
    return formDataToFilterModel(formData);
  }

  #renderChips(filters: FilterModel): void {
    const entries: [keyof FilterModel, string][] = [];

    if (filters.title) {
      entries.push(["title", `Title: ${filters.title}`]);
    }

    if (filters.location) {
      entries.push(["location", `Location: ${filters.location}`]);
    }

    if (typeof filters.minSalary === "number") {
      entries.push([
        "minSalary",
        `Salary: At least $${filters.minSalary.toLocaleString()}`,
      ]);
    }

    if (typeof filters.maxExperience === "number") {
      entries.push([
        "maxExperience",
        `Experience: I have at least ${filters.maxExperience} years`,
      ]);
    }

    if (typeof filters.daysSince === "number") {
      entries.push([
        "daysSince",
        `Posted: Within ${filters.daysSince.toLocaleString()} days`,
      ]);
    }

    const fragment = document.createDocumentFragment();

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
}

ComponentBase.register(tag, Filters);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Filters;
  }
}
