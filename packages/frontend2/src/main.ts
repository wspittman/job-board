import "@fontsource-variable/inter";
import "modern-normalize/modern-normalize.css";
//import "./style2.css";
import "./styles/base.css";
import "./styles/header.css";

import { setupCounter } from "./counter.ts";
import viteLogo from "/favicon.svg";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
