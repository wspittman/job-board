import { ComponentBase } from "./componentBase";
import css from "./explore-filters.css?raw";
import html from "./explore-filters.html?raw";
import "./form-input";

const cssSheet = ComponentBase.createCSSSheet(css);

export class ExploreFilters extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

  protected override onLoad(): void {}
}

ComponentBase.register("explore-filters", ExploreFilters);
