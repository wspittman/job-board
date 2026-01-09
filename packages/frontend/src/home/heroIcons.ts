import { ComponentBase } from "../components/componentBase.ts";

import css from "./heroIcons.css?raw";
import html from "./heroIcons.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "home-hero-icons";

class HeroIcons extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

  override async onLoad() {}
}

ComponentBase.register(tag, HeroIcons);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: HeroIcons;
  }
}
