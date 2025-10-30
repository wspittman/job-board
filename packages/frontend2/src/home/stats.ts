import { api } from "../api/api.ts";
import { ComponentBase } from "../components/componentBase.ts";
import css from "./stats.css?raw";
import html from "./stats.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

class Stats extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

  override async onLoad() {
    try {
      const data = await api.fetchMetadata();
      if (!this.isConnected) return;

      this.setText("job-count", data.jobCount.toLocaleString());
      this.setText("company-count", data.companyCount.toLocaleString());
      this.show();
    } catch (err) {
      // ignore
    }
  }
}

ComponentBase.register("home-stats", Stats);

declare global {
  interface HTMLElementTagNameMap {
    "home-stats": Stats;
  }
}
