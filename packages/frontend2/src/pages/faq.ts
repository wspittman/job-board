import { api } from "../api/api";
import { setAllDisplay, setAllText } from "../components/utils";
import "../sharedStyles/all.css";
import "./faq.css";

try {
  const data = await api.fetchMetadata();
  const lastRefreshed = `Last refreshed: ${new Date(
    data.timestamp
  ).toLocaleString()}`;
  setAllText(document, ".faq-note", lastRefreshed);
  setAllDisplay(document, ".faq-note", "block");
} catch (err) {
  // ignore
}
