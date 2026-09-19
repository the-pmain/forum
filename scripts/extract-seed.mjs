import fs from "node:fs";

const html = fs.readFileSync("Financial_Navigator_Cards_and_Small_Credit.html", "utf8");
const cssStart = html.indexOf("<style>");
const cssEnd = html.indexOf("</style>", cssStart);
if (cssStart < 0 || cssEnd < 0) throw new Error("css not found");
fs.mkdirSync("client/src", { recursive: true });
fs.writeFileSync("client/src/legacy.css", html.slice(cssStart + 7, cssEnd));
console.log("Wrote client/src/legacy.css. Directory seed is built by npm run catalog");
