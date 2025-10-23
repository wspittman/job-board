import { ComponentBase } from "../../components/componentBase";
import "../../components/form-input";
import type { FormInput } from "../../components/form-input";
import css from "./filters.css?raw";
import html from "./filters.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

export class Filters extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

  protected override onLoad(): void {
    this.#appendInputs(
      this.getEl("filters"),
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
        name: "experience",
        prefix: "I have at least",
        suffix: "years experience",
      },
      {
        label: "Posted Since",
        name: "posted",
        suffix: "days ago",
      }
    );
  }

  #appendInputs(
    hostEl: HTMLElement | null,
    ...defs: Parameters<FormInput["init"]>[0][]
  ): void {
    if (!hostEl) return;
    for (const props of defs) {
      const el = document.createElement("jb-form-input");
      el.init({
        ...props,
        onChange: () => this.#notifyChange(),
      });
      hostEl.append(el);
    }
  }

  #notifyChange() {
    this.dispatchEvent(
      new CustomEvent("explore-filters-change", {
        bubbles: true,
        composed: true,
      })
    );
  }
}

ComponentBase.register("explore-filters", Filters);

declare global {
  interface HTMLElementTagNameMap {
    "explore-filters": Filters;
  }
}
