import { api } from "../api/api";
import { setDisplay, setText } from "../components/utils";
import "../sharedStyles/all.css";
import "./faq.css";

try {
  const data = await api.fetchMetadata();
  const lastRefreshed = `Last refreshed: ${new Date(
    data.timestamp
  ).toLocaleString()}`;
  setText(document, ".faq-note", lastRefreshed);
  setDisplay(document, ".faq-note", "block");
} catch (err) {
  // ignore
}
