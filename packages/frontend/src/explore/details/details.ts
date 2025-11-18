import type { JobModel } from "../../api/jobModel.ts";
import { ComponentBase } from "../../components/componentBase.ts";
import { DetailEmbed } from "./detail-embed.ts";

import css from "./details.css?raw";
import html from "./details.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "explore-details";

type CopyButtonState = "idle" | "copied" | "error";
const copyButtonAriaText: Record<CopyButtonState, string> = {
  idle: "Copy job link to clipboard",
  copied: "Link copied to clipboard",
  error: "Failed to copy link",
};

/**
 * Custom element that displays detailed information for a selected job.
 */
export class Details extends ComponentBase {
  readonly #copyButton: HTMLButtonElement;
  readonly #applyLink: HTMLAnchorElement;
  readonly #detailEmbed: DetailEmbed;
  #job?: JobModel;
  #copyResetHandle?: number;

  /**
   * Creates a details panel and wires up references to internal elements.
   */
  constructor() {
    super(html, cssSheet);
    this.#copyButton = this.getEl<HTMLButtonElement>("copy")!;
    this.#applyLink = this.getEl<HTMLAnchorElement>("apply")!;
    this.#detailEmbed = this.getEl<DetailEmbed>("description")!;
    this.#copyButton.addEventListener("click", () => this.#copyJobLink());
  }

  /**
   * Updates the job being displayed and re-renders the panel contents.
   * @param value - The job to render, or undefined to clear the panel.
   */
  async updateJob(value: JobModel | undefined) {
    if (this.#job?.id === value?.id) return;

    requestAnimationFrame(() => (this.scrollTop = 0));
    this.#job = value;
    await this.#render();
  }

  async #render() {
    if (!this.#job) return;

    const { title, company, location, salary, experience, postDate } =
      await this.#job.getDisplayStrings();

    this.setManyTexts({
      heading: title,
      company,
      salary,
      experience,
      location,
      "posted-date": postDate,
    });

    this.#detailEmbed.description = this.#job.description;
    this.#applyLink.href = this.#job.applyUrl;
    this.#applyLink.setAttribute(
      "aria-label",
      `Apply for ${title} position at ${company}`
    );
  }

  async #copyJobLink(): Promise<void> {
    if (!this.#job) return;

    try {
      await navigator.clipboard.writeText(this.#job.bookmarkUrl);
      this.#setCopyButtonState("copied");
    } catch {
      this.#setCopyButtonState("error");
    }
  }

  #setCopyButtonState(state: "idle" | "copied" | "error"): void {
    if (this.#copyResetHandle) {
      window.clearTimeout(this.#copyResetHandle);
      this.#copyResetHandle = undefined;
    }

    this.#copyButton.dataset["status"] = state;
    this.#copyButton.setAttribute("aria-label", copyButtonAriaText[state]);

    const timeout = window.setTimeout(
      () => this.#setCopyButtonState("idle"),
      2000
    );
    this.#copyResetHandle = timeout;
  }
}

ComponentBase.register(tag, Details);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Details;
  }
}
