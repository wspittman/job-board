import { ComponentBase } from "../components/componentBase";
import "../components/form-input";
import css from "./explore-filters.css?raw";
import html from "./explore-filters.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

export class ExploreFilters extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

  protected override onLoad(): void {}
}

ComponentBase.register("explore-filters", ExploreFilters);
