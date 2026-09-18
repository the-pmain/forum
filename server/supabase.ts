import { hasSupabase, config } from "./config.ts";

function restBase(): string {
  const raw = config.supabaseUrl.replace(/\/$/, "");
  return raw.endsWith("/rest/v1") ? raw : `${raw}/rest/v1`;
}

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!hasSupabase) throw new Error("Supabase is not configured.");
  const headers = new Headers(init.headers);
  headers.set("apikey", config.supabaseServiceRoleKey);
  headers.set("Authorization", `Bearer ${config.supabaseServiceRoleKey}`);
  headers.set("Content-Type", "application/json");
  if (!headers.has("Prefer")) headers.set("Prefer", "return=representation");
  const response = await fetch(`${restBase()}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PostgREST ${response.status}: ${body || response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface WorkspaceRow {
  id: string;
  payload: unknown;
  updated_at?: string;
}

export async function fetchWorkspaceRow(id: string): Promise<WorkspaceRow | null> {
  const rows = await rest<WorkspaceRow[]>(`/navigator_workspace?id=eq.${encodeURIComponent(id)}&select=*`);
  return rows[0] ?? null;
}

export async function upsertWorkspaceRow(id: string, payload: unknown): Promise<void> {
  await rest("/navigator_workspace", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id, payload, updated_at: new Date().toISOString() }),
  });
}

export interface CommentRow {
  id: string;
  entry_slug: string;
  country_slug: string | null;
  author_name: string;
  body: string;
  created_at: string;
}

export async function fetchComments(entrySlug: string): Promise<CommentRow[]> {
  return rest<CommentRow[]>(
    `/navigator_comments?entry_slug=eq.${encodeURIComponent(entrySlug)}&select=id,entry_slug,country_slug,author_name,body,created_at&order=created_at.desc`,
  );
}

export async function insertComment(comment: CommentRow): Promise<CommentRow> {
  const rows = await rest<CommentRow[]>("/navigator_comments", {
    method: "POST",
    body: JSON.stringify({
      id: comment.id,
      entry_slug: comment.entry_slug,
      country_slug: comment.country_slug,
      author_name: comment.author_name,
      body: comment.body,
      created_at: comment.created_at,
    }),
  });
  return rows[0] ?? comment;
}
