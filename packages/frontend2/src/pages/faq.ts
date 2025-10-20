import { api } from "../api/api";
import "../sharedStyles/all.css";
import "./faq.css";

try {
  const data = await api.fetchMetadata();
  const lastRefreshed = `Last refreshed: ${new Date(
    data.timestamp
  ).toLocaleString()}`;

  const els = document.querySelectorAll<HTMLElement>(".faq-note");
  for (const el of els) {
    el.textContent = lastRefreshed;
    el.style.display = "block";
  }
} catch (err) {
  // ignore
}
