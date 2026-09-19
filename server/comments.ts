import { randomUUID } from "node:crypto";
import { commentPlainText, sanitizeCommentHtml } from "../shared/commentHtml.ts";
import { COUNTRY_SLUGS } from "../shared/constants.ts";
import type { EntryComment } from "../shared/types.ts";
import { hasSupabase } from "./config.ts";
import { fetchComments, insertComment, tableMissing } from "./supabase.ts";

const memory = new Map<string, EntryComment[]>();
const COUNTRY_SLUG_SET = new Set<string>(Object.values(COUNTRY_SLUGS));
const ENTRY_SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function cleanSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function cleanCountrySlug(value: unknown): string | null {
  if (value == null || value === "") return null;
  const slug = cleanSlug(String(value));
  return COUNTRY_SLUG_SET.has(slug) ? slug : null;
}

function cleanName(value: unknown): string {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) throw new Error("Enter a name between 2 and 80 characters.");
  return name;
}

function cleanBody(value: unknown): string {
  const body = sanitizeCommentHtml(value);
  const text = commentPlainText(body);
  if (text.length < 2 || text.length > 2000) throw new Error("Enter a comment between 2 and 2,000 characters.");
  if (body.length > 2000) throw new Error("Formatted comment is too long for the current database limit.");
  return body;
}

function cleanId(value: unknown): string | null {
  const id = String(value ?? "").trim();
  if (!id) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("Invalid comment reference.");
  }
  return id;
}

function publicComment(comment: EntryComment): EntryComment {
  return {
    ...comment,
    body: sanitizeCommentHtml(comment.body) || comment.body,
    is_admin: comment.is_admin === true,
    parent_id: comment.parent_id || null,
  };
}

function fromMemory(slug: string): EntryComment[] {
  return [...(memory.get(slug) || [])];
}

function intoMemory(comment: EntryComment): EntryComment {
  memory.set(comment.entry_slug, [comment, ...(memory.get(comment.entry_slug) || [])]);
  return comment;
}

function publicSupabaseError(error: unknown, fallback: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (!/^PostgREST /i.test(message)) return error instanceof Error ? error : new Error(message);
  if (/23514|check constraint/i.test(message)) {
    return new Error("Enter a name between 2 and 80 characters and a comment between 2 and 2,000 characters.");
  }
  return new Error(fallback);
}

export function sortComments(comments: EntryComment[]): EntryComment[] {
  return [...comments].sort((a, b) => {
    const admin = Number(b.is_admin === true) - Number(a.is_admin === true);
    if (admin) return admin;
    return b.created_at.localeCompare(a.created_at);
  }).map(publicComment);
}

export async function listComments(entrySlug: string): Promise<EntryComment[]> {
  const slug = cleanSlug(entrySlug);
  if (!slug || !ENTRY_SLUG_RE.test(slug)) return [];
  if (!hasSupabase) return sortComments(fromMemory(slug));
  try {
    return sortComments(await fetchComments(slug));
  } catch (error) {
    if (tableMissing(error)) return sortComments(fromMemory(slug));
    throw publicSupabaseError(error, "Could not load comments right now.");
  }
}

export async function addComment(
  entrySlug: string,
  input: { name?: unknown; body?: unknown; countrySlug?: unknown; parentId?: unknown },
  admin: boolean,
): Promise<EntryComment> {
  const slug = cleanSlug(entrySlug);
  if (!slug || !ENTRY_SLUG_RE.test(slug)) throw new Error("Missing entry slug.");
  const parentId = admin ? cleanId(input.parentId) : null;
  if (parentId) {
    const existing = await listComments(slug);
    const parent = existing.find((item) => item.id === parentId);
    if (!parent) throw new Error("The comment you are replying to was not found.");
    if (parent.parent_id) throw new Error("Replies cannot be nested further.");
  }
  const comment: EntryComment = {
    id: randomUUID(),
    entry_slug: slug,
    country_slug: cleanCountrySlug(input.countrySlug),
    author_name: admin ? "Admin" : cleanName(input.name),
    body: cleanBody(input.body),
    created_at: new Date().toISOString(),
    is_admin: admin,
    parent_id: parentId,
  };
  if (!hasSupabase) return publicComment(intoMemory(comment));
  try {
    return publicComment(await insertComment(comment));
  } catch (error) {
    if (tableMissing(error)) return publicComment(intoMemory(comment));
    throw publicSupabaseError(error, "Could not save the comment right now.");
  }
}
