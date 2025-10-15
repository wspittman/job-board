import "./stat-card-area.css";
import html from "./stat-card-area.html?raw";

class StatCardAreaElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html;
  }
}

if (!customElements.get("stat-card-area")) {
  customElements.define("stat-card-area", StatCardAreaElement);
}
