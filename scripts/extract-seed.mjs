import fs from "node:fs";

const html = fs.readFileSync("Financial_Navigator_Cards_and_Small_Credit.html", "utf8");
const seedStart = html.indexOf('<script id="seed-data" type="application/json">');
const seedEnd = html.indexOf("</script>", seedStart);
if (seedStart < 0 || seedEnd < 0) throw new Error("seed not found");
const seedJson = html.slice(html.indexOf(">", seedStart) + 1, seedEnd);
const seed = JSON.parse(seedJson);
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/seed.json", JSON.stringify(seed));

const cssStart = html.indexOf("<style>");
const cssEnd = html.indexOf("</style>", cssStart);
if (cssStart < 0 || cssEnd < 0) throw new Error("css not found");
fs.mkdirSync("client/src", { recursive: true });
fs.writeFileSync("client/src/legacy.css", html.slice(cssStart + 7, cssEnd));

const categories = [...new Set(seed.providers.map((p) => p.category))];
console.log(
  JSON.stringify(
    {
      providers: seed.providers.length,
      trash: (seed.trash || []).length,
      countries: seed.countries,
      categories,
      cssBytes: cssEnd - cssStart,
      seedBytes: Buffer.byteLength(JSON.stringify(seed)),
      workspaceId: seed.workspaceId,
    },
    null,
    2,
  ),
);
