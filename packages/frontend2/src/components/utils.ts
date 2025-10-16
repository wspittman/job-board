import norm from "modern-normalize/modern-normalize.css?raw";
import parts from "../sharedStyles/parts.css?raw";

const normSheet = new CSSStyleSheet();
normSheet.replaceSync(norm);

const partsSheet = new CSSStyleSheet();
partsSheet.replaceSync(parts);

export const componentCssReset = [normSheet, partsSheet];

export function setText(root: ShadowRoot, selector: string, value: string) {
  const el = root.querySelector<HTMLElement>(selector);
  if (el) {
    el.textContent = value;
  }
}

export function setDisplay(root: ShadowRoot, selector: string, value: string) {
  const el = root.querySelector<HTMLElement>(selector);
  if (el) {
    el.style.display = value;
  }
}
