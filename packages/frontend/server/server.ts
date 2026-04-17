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

interface UrlParts {
  dir: string;
  base: string;
  ext: string;
  urlPath: string;
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

const PAGES = new Set(["blog", "index", "faq", "404", "jobs"]);
const METHOD_ALLOWED = new Set(["GET", "HEAD", "POST"]);
const POST_ALLOWED = new Set(["/api/beacon", "/api/interpret"]);

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

  if (
    !METHOD_ALLOWED.has(req.method) ||
    (req.method === "POST" && !POST_ALLOWED.has(req.path))
  ) {
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
  } else if (typeof urlParts === "string") {
    return res.redirect(urlParts);
  }

  await setCompressionUrl(urlParts, encodings);
  req._urlParts = urlParts;
  req.url = urlParts.urlPath;
  next();
});

// Serve static files
app.use(
  express.static(__dist, {
    setHeaders(res) {
      const { ext, compEnc, dir } = res.req._urlParts ?? {};

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

      if (ext === ".html") {
        // Cache HTML files for 15 minutes
        res.setHeader("Cache-Control", "public, max-age=900");
        return;
      }

      // Cache site metadata files for 1 week
      res.setHeader("Cache-Control", "public, max-age=604800");
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

/**
 * Given a request, determines the corresponding file to serve based on URL patterns and available files.
 * @param req The incoming HTTP request object.
 * @returns The URL parts if a corresponding file is found, otherwise a redirect path or "404_hard"
 */
async function getUrlParts(req: Request): Promise<UrlParts | string> {
  const url = URL.parse(req.url, "http://does.not.matter");

  if (!url) return "404_hard";

  const urlPath = url.pathname.toLowerCase();
  const dir = dirnameURL(urlPath);
  const ext = extnameURL(urlPath) || ".html";
  const base = basenameURL(urlPath, ext) || "index";
  const urlParts = { dir, base, ext, urlPath: joinURL(dir, `${base}${ext}`) };

  if (ext !== ".html") {
    return (await fileExists(urlParts)) ? urlParts : "404_hard";
  }

  if (dir === "/blog") {
    return (await fileExists(urlParts)) ? urlParts : "/404";
  }

  // The /jobs path was previously /explore, so we want to support old links.
  if (dir === "/" && base === "explore") {
    return "/jobs" + url.search;
  }

  const isRootPage = dir === "/" && PAGES.has(base);
  return isRootPage ? urlParts : "/404";
}

async function setCompressionUrl(
  urlParts: UrlParts,
  { useBrotli, useGzip }: Encodings,
) {
  if (useBrotli && (await fileExists(urlParts, ".br"))) {
    urlParts.urlPath += ".br";
    urlParts.compEnc = "br";
  } else if (useGzip && (await fileExists(urlParts, ".gz"))) {
    urlParts.urlPath += ".gz";
    urlParts.compEnc = "gzip";
  }
}

async function fileExists(
  { dir, base, ext }: UrlParts,
  enc: string = "",
): Promise<boolean> {
  const filePath = joinFS(__dist, dir, `${base}${ext}`) + enc;
  return access(filePath, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API proxying to: ${API_URL}`);
});
