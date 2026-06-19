const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(process.argv[2] || "dist");
const port = Number(process.argv[3] || 5055);
const types = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

http
  .createServer((request, response) => {
    const urlPath = decodeURIComponent((request.url || "/").split("?")[0]);
    const routePath = urlPath === "/" ? "/index.html" : urlPath;
    let filePath = path.join(root, routePath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(root, "index.html");
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      });
      response.end(data);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Static server listening on http://127.0.0.1:${port}`);
  });
