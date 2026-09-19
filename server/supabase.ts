import { CODES, COUNTRIES, COUNTRY_SLUGS } from "../shared/constants.ts";
import { hasSupabase, config } from "./config.ts";

function restBase(): string {
  const raw = config.supabaseUrl.replace(/\/$/, "");
  return raw.endsWith("/rest/v1") ? raw : `${raw}/rest/v1`;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function tableMissing(error: unknown): boolean {
  const message = errorText(error);
  if (/PGRST204|42703/i.test(message)) return false;
  return /PGRST205|42P01|does not exist/i.test(message);
}

function columnMissing(error: unknown, columns: string[]): boolean {
  const message = errorText(error);
  if (!/PGRST204|42703/i.test(message)) return false;
  return columns.some((column) => message.includes(column));
}

function countryFkError(error: unknown): boolean {
  const message = errorText(error);
  return /23503/i.test(message) && /country_slug/i.test(message);
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
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export interface CommentRow {
  id: string;
  entry_slug: string;
  country_slug: string | null;
  author_name: string;
  body: string;
  created_at: string;
  is_admin: boolean;
  parent_id: string | null;
}

const COUNTRY_ROWS = COUNTRIES.map((name) => ({
  slug: COUNTRY_SLUGS[name],
  name,
  code: CODES[name],
}));

let countriesPromise: Promise<void> | null = null;

export async function ensureCountries(): Promise<void> {
  if (!hasSupabase) return;
  if (!countriesPromise) {
    countriesPromise = rest<unknown>("/navigator_countries?on_conflict=slug", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(COUNTRY_ROWS),
    }).then(() => undefined);
  }
  try {
    await countriesPromise;
  } catch {
    countriesPromise = null;
  }
}

function asComment(row: Partial<CommentRow> & Pick<CommentRow, "id" | "entry_slug" | "author_name" | "body" | "created_at">): CommentRow {
  return {
    id: row.id,
    entry_slug: row.entry_slug,
    country_slug: row.country_slug ?? null,
    author_name: row.author_name,
    body: row.body,
    created_at: row.created_at,
    is_admin: row.is_admin === true,
    parent_id: row.parent_id || null,
  };
}

export async function fetchComments(entrySlug: string): Promise<CommentRow[]> {
  const query = `/navigator_comments?entry_slug=eq.${encodeURIComponent(entrySlug)}&select=id,entry_slug,country_slug,author_name,body,created_at,is_admin,parent_id&order=is_admin.desc,created_at.desc`;
  try {
    return (await rest<CommentRow[]>(query)).map(asComment);
  } catch (error) {
    if (!columnMissing(error, ["is_admin", "parent_id"])) throw error;
    const rows = await rest<CommentRow[]>(
      `/navigator_comments?entry_slug=eq.${encodeURIComponent(entrySlug)}&select=id,entry_slug,country_slug,author_name,body,created_at&order=created_at.desc`,
    );
    return rows.map(asComment);
  }
}

type CommentPayload = {
  id: string;
  entry_slug: string;
  country_slug: string | null;
  author_name: string;
  body: string;
  created_at: string;
  is_admin: boolean;
  parent_id: string | null;
};

async function postComment(payload: CommentPayload, retryCountry: boolean): Promise<CommentRow> {
  try {
    const rows = await rest<CommentRow[]>("/navigator_comments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return asComment(rows[0] ?? payload);
  } catch (error) {
    if (retryCountry && payload.country_slug && countryFkError(error)) {
      return postComment({ ...payload, country_slug: null }, false);
    }
    if (columnMissing(error, ["is_admin", "parent_id"])) {
      const { is_admin: _isAdmin, parent_id: _parentId, ...legacy } = payload;
      const rows = await rest<CommentRow[]>("/navigator_comments", {
        method: "POST",
        body: JSON.stringify(legacy),
      });
      return asComment({ ...(rows[0] ?? payload), is_admin: payload.is_admin, parent_id: payload.parent_id });
    }
    throw error;
  }
}

export async function insertComment(comment: CommentRow): Promise<CommentRow> {
  await ensureCountries();
  return postComment({
    id: comment.id,
    entry_slug: comment.entry_slug,
    country_slug: comment.country_slug,
    author_name: comment.author_name,
    body: comment.body,
    created_at: comment.created_at,
    is_admin: comment.is_admin === true,
    parent_id: comment.parent_id || null,
  }, true);
}
