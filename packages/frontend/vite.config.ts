import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { htmlPartials } from "./plugins/htmlPartials.ts";
import { inlineLucideIcons } from "./plugins/inlineLucideIcons.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  appType: "mpa",
  plugins: [htmlPartials(), inlineLucideIcons()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        faq: resolve(__dirname, "faq.html"),
        404: resolve(__dirname, "404.html"),
        explore: resolve(__dirname, "explore.html"),
      },
    },
  },
});
