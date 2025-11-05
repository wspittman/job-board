import { metadataModel } from "../api/metadataModel";
import "../sharedStyles/all.css";
import "./faq.css";

try {
  const lastRefreshed = `Last refreshed: ${await metadataModel.getTimestampString()}`;

  const els = document.querySelectorAll<HTMLElement>(".faq-note");
  for (const el of els) {
    el.textContent = lastRefreshed;
    el.style.display = "block";
  }
} catch (err) {
  // ignore
}
