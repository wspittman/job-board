import { ComponentBase } from "../components/componentBase";

const html = '<div id="content"></div>';
const cssSheet = ComponentBase.createCSSSheet(
  "* { font: 14px/1.5 system-ui, sans-serif; }"
);

export class DetailEmbed extends ComponentBase {
  constructor() {
    super(html, cssSheet, { omitPartsCss: true });
  }

  set description(descriptionHtml: string) {
    this.getEl("content")!.innerHTML = descriptionHtml;
  }
}

ComponentBase.register("explore-detail-embed", DetailEmbed);
