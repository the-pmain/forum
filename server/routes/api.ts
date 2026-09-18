import { Router, type Request, type Response, type NextFunction } from "express";
import { filterRecords } from "../../shared/filter.ts";
import { DEFAULT_VIEW, type DirectoryView } from "../../shared/types.ts";
import { newProviderId, normaliseProvider } from "../../shared/workspace.ts";
import { config } from "../config.ts";
import { buildDirectoryDocx, buildDirectoryPdf, inspectPdf } from "../lib/documents.ts";
import { rateLimit } from "../rateLimit.ts";
import { clearSessionCookie, isAdmin, passwordsMatch, requireAdmin, setSessionCookie } from "../session.ts";
import { addComment, listComments } from "../comments.ts";
import {
  emptyTrash,
  exportWorkspace,
  getWorkspace,
  importWorkspace,
  moveToTrash,
  permanentDelete,
  publicise,
  restoreProvider,
  saveProvider,
} from "../store.ts";

function wrap(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

export const api = Router();

api.get("/health", (_req, res) => {
  res.json({ ok: true, service: "financial-navigator" });
});

api.get("/auth/me", (req, res) => {
  res.json({ admin: isAdmin(req) });
});

api.post("/auth/login", rateLimit(60_000, 10), (req, res) => {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!passwordsMatch(password, config.adminPassword)) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }
  setSessionCookie(res);
  res.json({ admin: true });
});

api.post("/auth/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ admin: false });
});

api.get("/workspace", rateLimit(60_000, 120), wrap(async (req, res) => {
  const admin = isAdmin(req);
  const workspace = await getWorkspace(admin);
  res.json({ workspace: publicise(workspace, admin), admin });
}));

api.post("/providers", requireAdmin, rateLimit(60_000, 60), wrap(async (req, res) => {
  const record = { ...req.body, id: req.body?.id || newProviderId(), updatedAt: new Date().toISOString(), origin: req.body?.origin || "User-added" };
  const workspace = await saveProvider(normaliseProvider(record));
  res.status(201).json({ workspace: publicise(workspace, true), admin: true });
}));

api.put("/providers/:id", requireAdmin, rateLimit(60_000, 60), wrap(async (req, res) => {
  const id = String(req.params.id);
  const record = { ...req.body, id, updatedAt: new Date().toISOString() };
  const workspace = await saveProvider(normaliseProvider(record), id);
  res.json({ workspace: publicise(workspace, true), admin: true });
}));

api.delete("/providers/:id", requireAdmin, rateLimit(60_000, 60), wrap(async (req, res) => {
  const workspace = await moveToTrash(String(req.params.id));
  res.json({ workspace: publicise(workspace, true), admin: true });
}));

api.post("/providers/:id/restore", requireAdmin, rateLimit(60_000, 60), wrap(async (req, res) => {
  const workspace = await restoreProvider(String(req.params.id));
  res.json({ workspace: publicise(workspace, true), admin: true });
}));

api.delete("/providers/:id/permanent", requireAdmin, rateLimit(60_000, 60), wrap(async (req, res) => {
  const workspace = await permanentDelete(String(req.params.id));
  res.json({ workspace: publicise(workspace, true), admin: true });
}));

api.post("/trash/empty", requireAdmin, rateLimit(60_000, 10), wrap(async (_req, res) => {
  const workspace = await emptyTrash();
  res.json({ workspace: publicise(workspace, true), admin: true });
}));

api.get("/workspace/export", requireAdmin, rateLimit(60_000, 20), wrap(async (_req, res) => {
  const workspace = await exportWorkspace();
  res.setHeader("Content-Disposition", `attachment; filename="financial-navigator-backup.json"`);
  res.json({ ...workspace, exportedAt: new Date().toISOString() });
}));

api.post("/workspace/import", requireAdmin, rateLimit(60_000, 10), wrap(async (req, res) => {
  const mode = req.body?.mode === "replace" || req.body?.mode === "upgrade" ? req.body.mode : "merge";
  const workspace = await importWorkspace(req.body?.workspace ?? req.body, mode);
  res.json({ workspace: publicise(workspace, true), admin: true });
}));

function viewFromBody(body: unknown): DirectoryView {
  return { ...DEFAULT_VIEW, ...(body && typeof body === "object" ? body : {}) };
}

api.get("/entries/:slug/comments", rateLimit(60_000, 120), wrap(async (req, res) => {
  const comments = await listComments(String(req.params.slug));
  res.json({ comments });
}));

api.post("/entries/:slug/comments", rateLimit(60_000, 12), wrap(async (req, res) => {
  try {
    const comment = await addComment(String(req.params.slug), {
      name: req.body?.name,
      body: req.body?.body,
      countrySlug: req.body?.countrySlug,
    });
    res.status(201).json({ comment });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Could not save comment." });
  }
}));

api.post("/documents/pdf", rateLimit(60_000, 20), wrap(async (req, res) => {
  const admin = isAdmin(req);
  const workspace = await getWorkspace(admin);
  const view = viewFromBody(req.body?.view);
  const records = view.mode === "trash" ? workspace.trash : workspace.providers;
  const providers = filterRecords(records, view, req.body?.favorites || []);
  const title = typeof req.body?.title === "string" && req.body.title ? req.body.title : "Directory export";
  const bytes = await buildDirectoryPdf(providers, title);
  const inspect = await inspectPdf(bytes.slice());
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="financial-navigator.pdf"`);
  res.setHeader("X-Document-Pages", String(inspect.pages));
  res.end(Buffer.from(bytes));
}));

api.post("/documents/docx", rateLimit(60_000, 20), wrap(async (req, res) => {
  const admin = isAdmin(req);
  const workspace = await getWorkspace(admin);
  const view = viewFromBody(req.body?.view);
  const records = view.mode === "trash" ? workspace.trash : workspace.providers;
  const providers = filterRecords(records, view, req.body?.favorites || []);
  const title = typeof req.body?.title === "string" && req.body.title ? req.body.title : "Directory export";
  const buffer = await buildDirectoryDocx(providers, title);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="financial-navigator.docx"`);
  res.end(buffer);
}));
