import type { Job } from "../api/apiTypes.ts";
import css from "./explore-details.css?raw";
import html from "./explore-details.html?raw";
import { componentCssReset, getEl, setText } from "./utils.ts";

const cssSheet = new CSSStyleSheet();
cssSheet.replaceSync(css);

class ExploreDetails extends HTMLElement {
  static tag = "explore-details";

  #root: ShadowRoot;
  #job?: Job;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.adoptedStyleSheets = [...componentCssReset, cssSheet];
    this.#root.innerHTML = html;
  }

  set job(value: Job | undefined) {
    if (this.#job?.id === value?.id) return;

    this.#job = value;
    this.#render();
  }

  #render() {
    const job = this.#job;

    setText(
      this.#root,
      "#details-heading",
      job ? job.title : "Select a role to preview the deets"
    );

    setText(this.#root, "#company", job ? job.company : "");

    setText(this.#root, "#location", job ? job.location : "");

    setText(
      this.#root,
      "#posted-date",
      job ? new Date(job.postTS).toLocaleDateString() : ""
    );

    getEl(this.#root, "#description")!.innerHTML = job ? job.description : "";
  }
}

if (!customElements.get(ExploreDetails.tag)) {
  customElements.define(ExploreDetails.tag, ExploreDetails);
}
