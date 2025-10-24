import type { FilterModel } from "../../api/apiTypes";
import { formDataToFilterModel } from "../../api/filterModelUtils";
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
  #debounceTimer: number | undefined;
  #onChange?: (filters: FilterModel) => void;

  constructor() {
    super(html, cssSheet);
    this.#form = this.getEl<HTMLFormElement>("form")!;

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
    for (const props of defs) {
      const el = document.createElement("jb-form-input");
      el.init({ ...props, onChange });
      this.#form.append(el);
    }
  }

  #debounceOnChange(): void {
    if (!this.#onChange) return;

    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
    }

    this.#debounceTimer = window.setTimeout(() => {
      this.#onChange?.(this.#getFilterData());
    }, DEBOUNCE_DELAY);
  }

  #getFilterData(): FilterModel {
    const formData = new FormData(this.#form);
    return formDataToFilterModel(formData);
  }
}

ComponentBase.register(tag, Filters);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Filters;
  }
}
