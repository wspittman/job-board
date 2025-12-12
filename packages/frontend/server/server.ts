import compression from "compression";
import type { NextFunction, Request, Response } from "express";
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

// #region Types

type T404 = "404_soft" | "404_hard";

interface UrlParts {
  dir: string;
  base: string;
  ext: string;
  compEnc?: "br" | "gzip";
}

interface Encodings {
  useBrotli: boolean;
  useGzip: boolean;
}

declare module "express-serve-static-core" {
  interface Request {
    _urlParts?: UrlParts;
  }
}

// #endregion

const PAGES = new Set(["index", "faq", "404", "explore"]);

const MAL_PATTERN = [
  // File Endings
  /\.env$/i,
  /\.php$/i,
  /\.php7$/i,

  // WordPress Paths
  /\/wp-admin/i,
  /\/wp-includes/i,
  /\/wp-content/i,

  // Other
  /\.git\/config/i,
];

function isExpressResponse(res: unknown): res is Response {
  return typeof (res as Response).status === "function";
}

// Get current directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dist = joinFS(dirnameFS(__filename), "dist");

const port = parseInt(process.env["PORT"] || "8080", 10);
const API_URL = process.env["API_URL"] || "http://localhost:3000/api";

const app = express();
app.use(helmet());

// Refuse malicious requests
app.use((req, res, next) => {
  if (MAL_PATTERN.some((pattern) => pattern.test(req.path))) {
    res.status(403).send("Forbidden");
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).send("Method Not Allowed");
    return;
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
  }),
);

// API proxy middleware
app.use(
  "/api",
  createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    on: {
      proxyRes: (_proxyRes, _req, res) => {
        // Avoid stale Content-Length after compression
        res.removeHeader("Content-Length");
        // Cache API responses for 1 hour
        res.setHeader("Cache-Control", "public, max-age=3600");
      },
      // Handle proxy errors
      error: (_err, _req, res) => {
        if (isExpressResponse(res)) {
          res.status(502).json({ error: "Service Unavailable" });
        }
      },
    },
  }),
);

// Middleware to handle URL rewriting and compression
app.use(async (req, res, next) => {
  const encodings = getEncodings(req);
  const urlParts = await getUrlParts(req);

  if (urlParts === "404_hard") {
    return res.status(404).send("Not Found");
  } else if (urlParts === "404_soft") {
    return res.redirect("/404");
  }

  req._urlParts = urlParts;
  req.url = await getCompressionUrl(urlParts, encodings);
  next();
});

// Serve static files
app.use(
  express.static(__dist, {
    setHeaders(res) {
      const { ext, compEnc, dir, base } = res.req._urlParts ?? {};

      if (ext) {
        res.type(ext);
      }

      if (compEnc) {
        res.setHeader("Vary", "Accept-Encoding");
        res.setHeader("Content-Encoding", compEnc);
      }

      if (dir?.startsWith("/assets")) {
        // Cache hashed assets for 1 year
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return;
      }

      if (base && ["favicon", "og-image", "robots", "sitemap"].includes(base)) {
        // Cache site metadata files for 1 week
        res.setHeader("Cache-Control", "public, max-age=604800");
        return;
      }

      // Cache other prebuilt files for 1 day
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  }),
);

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  let message = "Internal Server Error";

  if (err instanceof Error) {
    message = err.message || message;
  }

  res.status(500).json({
    status: "error",
    statusCode: 500,
    message,
  });
});

function getEncodings(req: Request): Encodings {
  const encodings = (req.header("Accept-Encoding") ?? "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim());

  return {
    useBrotli: encodings.includes("br"),
    useGzip: encodings.includes("gzip"),
  };
}

async function getUrlParts(req: Request): Promise<UrlParts | T404> {
  const url = URL.parse(req.url.toLowerCase(), "http://does.not.matter");

  if (!url) return "404_hard";

  const urlPath = url.pathname;
  const dir = dirnameURL(urlPath);
  const ext = extnameURL(urlPath) || ".html";
  const base = basenameURL(urlPath, ext) || "index";
  const isHtml = ext === ".html";

  if (isHtml) {
    const isRootPage = dir === "/" && PAGES.has(base);
    return isRootPage ? { dir, base, ext } : "404_soft";
  }

  const filePath = joinFS(__dist, dir, `${base}${ext}`);
  if (await fileExists(filePath)) {
    return { dir, base, ext };
  }

  return "404_hard";
}

async function getCompressionUrl(
  urlParts: UrlParts,
  { useBrotli, useGzip }: Encodings,
) {
  const { base, ext, dir } = urlParts;
  const filePath = joinFS(__dist, dir, `${base}${ext}`);
  const urlPath = joinURL(dir, `${base}${ext}`);

  if (useBrotli && (await fileExists(filePath + ".br"))) {
    urlParts.compEnc = "br";
    return urlPath + ".br";
  }

  if (useGzip && (await fileExists(filePath + ".gz"))) {
    urlParts.compEnc = "gzip";
    return urlPath + ".gz";
  }

  return urlPath;
}

async function fileExists(filePath: string): Promise<boolean> {
  return access(filePath, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API proxying to: ${API_URL}`);
});
