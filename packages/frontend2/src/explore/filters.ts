import { ComponentBase } from "../components/componentBase";
import "../components/form-input";
import css from "./filters.css?raw";
import html from "./filters.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

export class Filters extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

  protected override onLoad(): void {}
}

ComponentBase.register("explore-filters", Filters);
