import { ComponentBase } from "../components/componentBase";
import "../components/form-input";
import type { FormInput } from "../components/form-input";
import css from "./filters.css?raw";
import html from "./filters.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

export class Filters extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

  protected override onLoad(): void {
    const el = this.getEl("filters");
    if (el) {
      this.#appendInput(el, {
        label: "Title",
        name: "title",
        prefix: "🔍",
      });
    }
  }

  #appendInput(
    hostEl: HTMLElement,
    props: Parameters<FormInput["init"]>[0]
  ): void {
    const formInput = document.createElement("jb-form-input");
    formInput.init(props);
    hostEl.append(formInput);
  }
}

ComponentBase.register("explore-filters", Filters);

declare global {
  interface HTMLElementTagNameMap {
    "explore-filters": Filters;
  }
}
