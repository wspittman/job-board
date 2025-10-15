import "@fontsource-variable/inter";
import "modern-normalize/modern-normalize.css";
import { api } from "../api/api.ts";
import "../components/stat-card-area.ts";
import "../sharedStyles/base.css";
import "../sharedStyles/header.css";
import "./index.css";

const metaEl = document.getElementById("meta")!;

metaEl.innerHTML = "<p>Loading...</p>";
try {
  const data = await api.fetchMetadata();
  metaEl.innerHTML = `<p>Companies: ${data.companyCount}</p><p>Jobs: ${data.jobCount}</p>`;
} catch (error) {
  metaEl.innerHTML = `<p>Error: ${
    error instanceof Error ? error.message : error
  }</p>`;
}

setTimeout(async () => {
  await api.fetchMetadata();
}, 1000);
setTimeout(async () => {
  await api.fetchMetadata();
}, 10000);
