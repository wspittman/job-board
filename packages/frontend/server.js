import compression from "compression";
import express from "express";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import { access, constants } from "node:fs/promises";
import { dirname as dirnameFS, join as joinFS } from "node:path";
import {
  basename as basenameURL,
  dirname as dirnameURL,
  extname as extnameURL,
  join as joinURL,
} from "node:path/posix";
import { fileURLToPath } from "node:url";

const PAGES = ["index", "faq", "404", "explore"];
const URL_PARTS_404 = { dir: "/", base: "404", ext: ".html" };

const MAL_PATTERN = [
  /\/wp-admin/i,
  /\/wp-includes/i,
  /\.php$/i,
  /\.git\/config/i,
];

// Get current directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dist = joinFS(dirnameFS(__filename), "dist");

const port = process.env.PORT || 8080;
const API_URL = process.env.API_URL || "http://localhost:3000/api";

const app = express();
app.use(helmet());

// Refuse malicious requests
app.use((req, res, next) => {
  if (MAL_PATTERN.some((pattern) => pattern.test(req.path))) {
    return res.status(404).send("Not Found");
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).send("Method Not Allowed");
  }

  next();
});

// Compress only sizable, JSON payloads (ie. API responses)
app.use(
  compression({
    threshold: 1024,
    filter: (req, res) => {
      const type = res.getHeader("Content-Type")?.toString() || "";
      if (!type.includes("application/json")) return false;
      return compression.filter(req, res);
    },
  })
);

// API proxy middleware
app.use(
  "/api",
  createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    onProxyRes: (_proxyRes, _req, res) => {
      // Avoid stale Content-Length after compression
      res.removeHeader("Content-Length");
    },
    // Handle proxy errors
    onError: (err, req, res) => {
      console.error("Proxy Error:", err);
      res.status(500).json({ error: "Proxy Error" });
    },
  })
);

// Middleware to handle URL rewriting and compression
app.use(async (req, res, next) => {
  const encodings = getEncodings(req);
  const urlParts = getUrlParts(req);
  req._urlParts = urlParts;
  req.url = await getCompressionUrl(urlParts, encodings);
  next();
});

// Serve static files
app.use(
  express.static(__dist, {
    setHeaders(res) {
      const { ext, compEnc } = res.req?._urlParts ?? {};

      if (!compEnc) {
        return;
      }

      res.type(ext);
      res.setHeader("Vary", "Accept-Encoding");
      res.setHeader("Content-Encoding", compEnc);
    },
  })
);

function getUrlParts(req) {
  const url = URL.parse(req.url.toLowerCase(), "http://does.not.matter");

  if (!url) {
    return URL_PARTS_404;
  }

  const urlPath = url.pathname;
  const dir = dirnameURL(urlPath);
  const ext = extnameURL(urlPath) || ".html";
  const base = basenameURL(urlPath, ext) || "index";

  if (ext === ".html" && (dir !== "/" || !PAGES.includes(base))) {
    return URL_PARTS_404;
  }

  return { dir, base, ext };
}

async function getCompressionUrl(url, { useBrotli, useGzip }) {
  const { base, ext, dir } = url;
  const filePath = joinFS(__dist, dir, `${base}${ext}`);
  const urlPath = joinURL(dir, `${base}${ext}`);

  if (useBrotli && (await fileExists(filePath + ".br"))) {
    url.compEnc = "br";
    return urlPath + ".br";
  }

  if (useGzip && (await fileExists(filePath + ".gz"))) {
    url.compEnc = "gzip";
    return urlPath + ".gz";
  }

  if (await fileExists(filePath)) {
    return urlPath;
  }

  return joinURL("/", "404.html");
}

function getEncodings(req) {
  const encodings = (req.header("Accept-Encoding") ?? "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim());

  return {
    useBrotli: encodings.includes("br"),
    useGzip: encodings.includes("gzip"),
  };
}

async function fileExists(x) {
  return access(x, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API proxying to: ${API_URL}`);
});
