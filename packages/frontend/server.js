import express from "express";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import { access, constants } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_PAGES = ["index", "faq", "404", "explore"];

// Get current directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet());
const port = process.env.PORT || 8080;

// Get backend URL from environment variable
const API_URL = process.env.API_URL || "http://localhost:3000/api";

// API proxy middleware
app.use(
  "/api",
  createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    // Handle proxy errors
    onError: (err, req, res) => {
      console.error("Proxy Error:", err);
      res.status(500).json({ error: "Proxy Error" });
    },
  })
);

// Malicious request patterns
const maliciousPatterns = [
  /\/wp-admin/i,
  /\/wp-includes/i,
  /\.php$/i,
  /\.git\/config/i,
];

// Middleware to check for malicious requests
app.use((req, res, next) => {
  if (maliciousPatterns.some((pattern) => pattern.test(req.path))) {
    console.log(`Blocked malicious request to: ${req.path}`);
    return res.status(404).send("Not Found");
  }
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, "dist")));

app.get("/:page", async (req, res, next) => {
  try {
    let { page = "index" } = req.params;
    page = page.trim().toLowerCase();

    if (ALLOWED_PAGES.includes(page)) {
      serveCompressedFile(`${page}.html`, req, res);
      return;
    }
  } catch (_) {}

  serveCompressedFile("404.html", req, res);
});

async function serveCompressedFile(file, req, res) {
  const base = path.join(__dirname, "dist", file); //req.path

  if (!(await exists(base))) {
    // Problem with 404 page -> send generic 404 response
    if (base.includes("404.html")) {
      res.status(404).send("Not Found");
      return;
    }

    await serveCompressedFile("404.html", req, res);
    return;
  }

  const accept = req.header("Accept-Encoding") ?? "";
  res.set("Vary", "Accept-Encoding");

  if (await sendIf(res, accept, base, "br")) return;
  if (await sendIf(res, accept, base, "gzip", "gz")) return;
  res.sendFile(base);
}

async function sendIf(res, accept, base, name, extname = name) {
  if (accept.includes(name) && (await exists(`${base}.${extname}`))) {
    res.type(path.extname(base));
    res.setHeader("Content-Encoding", name);
    res.sendFile(`${base}.${extname}`);
    return true;
  }
  return false;
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {}
  return false;
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API proxying to: ${API_URL}`);
});
