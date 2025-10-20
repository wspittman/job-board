import { ComponentBase } from "./componentBase";

export class ExploreDetailEmbed extends ComponentBase {
  constructor() {
    super(
      '<div id="content"></div>',
      ComponentBase.createCSSSheet(
        "* { font: 14px/1.5 system-ui, sans-serif; }"
      ),
      true
    );
  }

  set description(descriptionHtml: string) {
    this.getEl("content")!.innerHTML = descriptionHtml;
  }
}

ComponentBase.register("explore-detail-embed", ExploreDetailEmbed);
