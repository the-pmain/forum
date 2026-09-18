import { build } from "vite";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import seedJson from "../data/seed.json" with { type: "json" };
import { WORKSPACE_ID } from "../shared/constants.ts";
import { normaliseWorkspace } from "../shared/workspace.ts";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const ssrOut = path.join(root, "dist-ssr");

const routes = ["/", "/help", "/entry", "/nl", "/nl/help", "/nl/entry", "/de", "/de/help", "/de/entry"];

await build({
  configFile: path.join(root, "vite.config.ts"),
  build: {
    ssr: path.join(root, "client/src/entry-server.tsx"),
    outDir: ssrOut,
    emptyOutDir: true,
  },
});

const entry = path.join(ssrOut, "entry-server.js");
const { render } = await import(pathToFileURL(entry).href) as { render: (url: string) => string };
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const payload = JSON.stringify(normaliseWorkspace(seedJson, WORKSPACE_ID)).replace(/</g, "\\u003c");
const dataScript = `<script>window.__NAVIGATOR__=${payload}</script>`;

for (const route of routes) {
  const html = render(route);
  const lang = route.startsWith("/nl") ? "nl" : route.startsWith("/de") ? "de" : "en";
  const page = template
    .replace("<html lang=\"en\">", `<html lang="${lang}">`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>${dataScript}`);
  const target = route === "/" ? path.join(dist, "index.html") : path.join(dist, route, "index.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, page);
  console.log(`prerendered ${route}`);
}

fs.rmSync(ssrOut, { recursive: true, force: true });
