import type { DirectoryView, EntryComment, Provider, Workspace } from "@shared/types.ts";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isAccessDenied(error: unknown): boolean {
  if (error instanceof ApiError) return error.status === 403;
  return error instanceof Error && error.message === "Access denied.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* keep default */
    }
    throw new ApiError(message, response.status);
  }
  return (await response.json()) as T;
}

export interface WorkspaceResponse {
  workspace: Workspace;
  admin: boolean;
}

export const api = {
  me: () => request<{ admin: boolean }>("/api/auth/me"),
  login: (password: string) => request<{ admin: boolean }>("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request<{ admin: boolean }>("/api/auth/logout", { method: "POST" }),
  workspace: () => request<WorkspaceResponse>("/api/workspace"),
  createProvider: (provider: Provider) => request<WorkspaceResponse>("/api/providers", { method: "POST", body: JSON.stringify(provider) }),
  updateProvider: (provider: Provider) => request<WorkspaceResponse>(`/api/providers/${provider.id}`, { method: "PUT", body: JSON.stringify(provider) }),
  trashProvider: (id: string) => request<WorkspaceResponse>(`/api/providers/${id}`, { method: "DELETE" }),
  restoreProvider: (id: string) => request<WorkspaceResponse>(`/api/providers/${id}/restore`, { method: "POST" }),
  moderateProvider: (id: string, flags: { verified?: boolean; hidden?: boolean }) =>
    request<WorkspaceResponse>(`/api/providers/${id}/moderation`, { method: "PATCH", body: JSON.stringify(flags) }),
  permanentDelete: (id: string) => request<WorkspaceResponse>(`/api/providers/${id}/permanent`, { method: "DELETE" }),
  emptyTrash: () => request<WorkspaceResponse>("/api/trash/empty", { method: "POST" }),
  exportWorkspace: () => request<Workspace & { exportedAt: string }>("/api/workspace/export"),
  importWorkspace: (workspace: unknown, mode: "merge" | "replace" | "upgrade") =>
    request<WorkspaceResponse>("/api/workspace/import", { method: "POST", body: JSON.stringify({ workspace, mode }) }),
  comments: (slug: string) => request<{ comments: EntryComment[] }>(`/api/entries/${encodeURIComponent(slug)}/comments`),
  addComment: (slug: string, payload: { name: string; body: string; countrySlug?: string; parentId?: string }) =>
    request<{ comment: EntryComment }>(`/api/entries/${encodeURIComponent(slug)}/comments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export async function downloadDocument(kind: "pdf" | "docx" | "csv", view: DirectoryView, favorites: string[], title: string) {
  if (kind === "csv") return;
  const response = await fetch(`/api/documents/${kind}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ view, favorites, title }),
  });
  if (!response.ok) throw new ApiError("Document export failed.", response.status);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `financial-navigator.${kind}`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}
