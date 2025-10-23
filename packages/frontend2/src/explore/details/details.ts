import type { JobModel } from "../../api/apiTypes.ts";
import { ComponentBase } from "../../components/componentBase.ts";
import { DetailEmbed } from "./detail-embed.ts";
import css from "./details.css?raw";
import html from "./details.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

export class Details extends ComponentBase {
  #job?: JobModel;

  constructor() {
    super(html, cssSheet);
  }

  set job(value: JobModel | undefined) {
    if (this.#job?.id === value?.id) return;

    this.#job = value;
    this.#render();
  }

  #render() {
    const { title, company, location, postTS, description } = this.#job ?? {};
    const postDate = postTS ? new Date(postTS).toLocaleDateString() : "";

    this.setManyTexts({
      heading: title,
      company,
      location,
      "posted-date": postDate,
    });

    const desc = this.getEl<DetailEmbed>("description");
    if (desc) {
      desc.description = description ?? "";
    }
  }
}

ComponentBase.register("explore-details", Details);

declare global {
  interface HTMLElementTagNameMap {
    "explore-details": Details;
  }
}
