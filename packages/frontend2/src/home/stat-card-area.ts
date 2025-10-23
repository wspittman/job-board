import { api } from "../api/api.ts";
import { ComponentBase } from "../components/componentBase.ts";
import css from "./stat-card-area.css?raw";
import html from "./stat-card-area.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

class StatCardArea extends ComponentBase {
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

ComponentBase.register("stat-card-area", StatCardArea);
