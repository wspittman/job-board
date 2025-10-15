import norm from "modern-normalize/modern-normalize.css?raw";
import parts from "../sharedStyles/parts.css?raw";

const NORM_SHEET = new CSSStyleSheet();
NORM_SHEET.replaceSync(norm);

const PARTS_SHEET = new CSSStyleSheet();
PARTS_SHEET.replaceSync(parts);

export const RESET = [NORM_SHEET, PARTS_SHEET];
