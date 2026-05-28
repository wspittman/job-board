import { metadataModel } from "../api/metadataModel.ts";
import { ComponentBase } from "../components/componentBase.ts";

import css from "./stats.css?raw";
import html from "./stats.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "home-stats";

class Stats extends ComponentBase {
  constructor() {
    super(html, cssSheet, { byoc: true });
  }

  override async onLoad() {
    try {
      const {
        companyCount,
        jobCount,
        remotePct,
        recentJobCount,
        topJobFamilies,
      } = await metadataModel.getCountStrings();
      if (!this.isConnected) return;

      this.setText("job-count", jobCount);
      this.setText("job-recent-count", recentJobCount);
      this.setText("company-count", companyCount);
      this.setText("remote-pct", remotePct);
      topJobFamilies.forEach(({ pct, label }, i) => {
        this.setText(`job-family-${i + 1}-pct`, pct);
        this.setText(`job-family-${i + 1}-label`, label);
      });

      this.style.display = "block";
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
