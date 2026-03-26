import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import compression from "vite-plugin-compression2";
import { htmlPartials } from "./plugins/htmlPartials.ts";
import { inlineLucideIcons } from "./plugins/inlineLucideIcons.ts";

const __dirname = join(dirname(fileURLToPath(import.meta.url)), "src");

export default defineConfig({
  root: "src",
  appType: "mpa",
  plugins: [
    htmlPartials(),
    inlineLucideIcons(),
    // Emit Brotli and gzip side-by-side
    compression({
      include: [/\.(js|mjs|css|html|svg|json|txt|xml)$/],
      algorithms: [
        "brotliCompress", // produces .br
        "gzip", // produces .gz
      ],
      threshold: 1024, // only compress >1KB
    }),
  ],
  build: {
    outDir: "../deploy/dist",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        faq: resolve(__dirname, "faq.html"),
        404: resolve(__dirname, "404.html"),
        explore: resolve(__dirname, "explore.html"),
      },
    },
  },
  server: {
    proxy: {
      // Proxy API requests to the backend server during development
      // But don't confuse with the /api code folder
      "^/api/.*[^ts]$": {
        // For external device testing, replace localhost with your machine's local IP address (ipconfig)
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
