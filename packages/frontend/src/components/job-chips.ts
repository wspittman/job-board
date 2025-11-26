import type { JobModel } from "../api/jobModel";
import { Chip } from "./chip";
import { ComponentBase } from "./componentBase";

import css from "./job-chips.css?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jb-job-chips";

interface Props {
  job: JobModel;
  useShort?: boolean;
}

/**
 * Custom element that displays a set of chips summarizing job attributes.
 */
export class JobChips extends ComponentBase {
  /**
   * Creates a job chips container.
   */
  constructor() {
    const html = `<div id="container" class="container"></div>`;
    super(html, cssSheet);
  }

  /**
   * Initializes a job chips element with chips based on the provided job.
   * @param job - Job information to display.
   * @param useShort - Whether to use short labels.
   * @returns A fully configured job chips element.
   */
  async init({ job, useShort }: Props) {
    const element = this.getEl<HTMLDivElement>("container")!;

    const { location, post, ...rest } = await job.getDisplayFacets(useShort);

    const labels = Object.values(rest);
    this.#pend(labels, location, location === "Remote");
    this.#pend(labels, post, useShort && !post.endsWith("days ago"));

    const children = labels
      .filter(Boolean)
      .map((label) => Chip.create({ label: label! }));

    element.replaceChildren(...children);

    return element;
  }

  #pend(labels: unknown[], label: string, isPrepend = false) {
    if (isPrepend) {
      labels.unshift(label);
    } else {
      labels.push(label);
    }
  }
}

ComponentBase.register(tag, JobChips);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: JobChips;
  }
}
