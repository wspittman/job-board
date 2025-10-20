import type { Job } from "../api/apiTypes.ts";
import { ComponentBase } from "./componentBase.ts";
import { ExploreDetailEmbed } from "./explore-detail-embed.ts";
import css from "./explore-details.css?raw";
import html from "./explore-details.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

class ExploreDetails extends ComponentBase {
  #job?: Job;

  constructor() {
    super(html, cssSheet);
  }

  set job(value: Job | undefined) {
    if (this.#job?.id === value?.id) return;

    this.#job = value;
    this.#render();
  }

  #render() {
    const { title, company, location, postTS, description } = this.#job ?? {};
    const postDate = postTS ? new Date(postTS).toLocaleDateString() : "";

    this.setText(
      "details-heading",
      title ?? "Select a role to preview the deets"
    );

    this.setText("company", company);
    this.setText("location", location);
    this.setText("posted-date", postDate);

    const desc = this.getEl<ExploreDetailEmbed>("description");
    if (desc) {
      desc.description = description ?? "";
    }
  }
}

ComponentBase.register("explore-details", ExploreDetails);
