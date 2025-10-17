import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { access, constants } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_PAGES = ["index", "faq", "404"];

// Get current directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
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
      const htmlFilePath = path.join(__dirname, "dist", `${page}.html`);

      // Check if the file exists
      await access(htmlFilePath, constants.F_OK);
      res.sendFile(htmlFilePath);
      return;
    }
  } catch (_) {}

  res.sendFile(path.join(__dirname, "dist", "404.html"));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API proxying to: ${API_URL}`);
});
