const ALLOWED = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a"]);
const VOID = new Set(["br"]);

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function safeHref(value: string): string {
  const href = value.trim();
  if (!href) return "";
  try {
    const url = new URL(href);
    if (!["http:", "https:", "mailto:"].includes(url.protocol) || url.username || url.password) return "";
    return url.href;
  } catch {
    return "";
  }
}

export function commentPlainText(html: string): string {
  return String(html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function sanitizeCommentHtml(raw: unknown): string {
  const input = String(raw ?? "");
  if (!input.trim()) return "";
  const stripped = input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|link|meta|svg|math)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?(script|style|iframe|object|embed|link|meta|svg|math)[^>]*>/gi, "");

  let out = "";
  const open: string[] = [];
  const tokens = stripped.match(/<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>|[^<]+/g) || [];
  for (const token of tokens) {
    if (!token.startsWith("<")) {
      out += escapeText(token);
      continue;
    }
    const parsed = token.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/);
    if (!parsed) continue;
    let tag = parsed[1].toLowerCase();
    if (tag === "div") tag = "p";
    if (!ALLOWED.has(tag)) continue;
    const closing = token.startsWith("</");
    if (closing) {
      const idx = open.lastIndexOf(tag);
      if (idx < 0) continue;
      while (open.length > idx) out += `</${open.pop()}>`;
      continue;
    }
    if (VOID.has(tag)) {
      out += "<br>";
      continue;
    }
    if (tag === "a") {
      const hrefMatch = parsed[2].match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = safeHref(hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || "");
      if (!href) continue;
      open.push("a");
      out += `<a href="${escapeAttr(href)}" rel="noopener noreferrer" target="_blank">`;
      continue;
    }
    open.push(tag);
    out += `<${tag}>`;
  }
  while (open.length) out += `</${open.pop()}>`;
  return commentPlainText(out) ? out.trim() : "";
}
