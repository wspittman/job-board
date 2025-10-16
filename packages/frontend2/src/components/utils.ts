import norm from "modern-normalize/modern-normalize.css?raw";
import parts from "../sharedStyles/parts.css?raw";

type Node = ShadowRoot | HTMLElement | Document;

const normSheet = new CSSStyleSheet();
normSheet.replaceSync(norm);

const partsSheet = new CSSStyleSheet();
partsSheet.replaceSync(parts);

export const componentCssReset = [normSheet, partsSheet];

const getEl = (root: Node, selector: string) =>
  root.querySelector<HTMLElement>(selector);
const getAllEls = (root: Node, selector: string) =>
  root.querySelectorAll<HTMLElement>(selector);

export function setText(root: Node, selector: string, value: string) {
  const el = getEl(root, selector);
  if (el) el.textContent = value;
}

export function setAllText(root: Node, selector: string, value: string) {
  const els = getAllEls(root, selector);
  els.forEach((el) => (el.textContent = value));
}

export function setDisplay(root: Node, selector: string, value: string) {
  const el = getEl(root, selector);
  if (el) el.style.display = value;
}

export function setAllDisplay(root: Node, selector: string, value: string) {
  const els = getAllEls(root, selector);
  els.forEach((el) => (el.style.display = value));
}
