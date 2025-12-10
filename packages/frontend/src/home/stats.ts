import { metadataModel } from "../api/metadataModel.ts";
import { ComponentBase } from "../components/componentBase.ts";

import css from "./stats.css?raw";
import html from "./stats.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "home-stats";

class Stats extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

  override async onLoad() {
    try {
      const { jobCount, companyCount } = await metadataModel.getCountStrings();
      if (!this.isConnected) return;

      this.setText("job-count", jobCount);
      this.setText("company-count", companyCount);
      this.show();
    } catch {
      // ignore
    }
  }
}

ComponentBase.register(tag, Stats);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Stats;
  }
}
