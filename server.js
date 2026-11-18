import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8", ".jpg": "image/jpeg" };
const server = createServer(async (request, response) => {
  try {
    const path = request.url === "/" ? "/index.html" : request.url.split("?")[0];
    const content = await readFile(join(process.cwd(), path));
    response.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("No encontrado");
  }
});

const port = Number(process.env.PORT || 4173);
server.listen(port, () => console.log(`Lo Cosito disponible en http://localhost:${port}`));
