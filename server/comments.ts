import { randomUUID } from "node:crypto";
import { commentPlainText, sanitizeCommentHtml } from "../shared/commentHtml.ts";
import type { EntryComment } from "../shared/types.ts";
import { hasSupabase } from "./config.ts";
import { fetchComments, insertComment } from "./supabase.ts";

const memory = new Map<string, EntryComment[]>();

function cleanSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
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

function publicComment(comment: EntryComment): EntryComment {
  return { ...comment, body: sanitizeCommentHtml(comment.body) || comment.body };
}

function fromMemory(slug: string): EntryComment[] {
  return [...(memory.get(slug) || [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function intoMemory(comment: EntryComment): EntryComment {
  memory.set(comment.entry_slug, [comment, ...(memory.get(comment.entry_slug) || [])]);
  return comment;
}

function tableMissing(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /does not exist|PGRST205|42P01|schema cache/i.test(message);
}

export async function listComments(entrySlug: string): Promise<EntryComment[]> {
  const slug = cleanSlug(entrySlug);
  if (!slug) return [];
  if (!hasSupabase) return fromMemory(slug).map(publicComment);
  try {
    return (await fetchComments(slug)).map(publicComment);
  } catch (error) {
    if (tableMissing(error)) return fromMemory(slug).map(publicComment);
    throw error;
  }
}

export async function addComment(entrySlug: string, input: { name?: unknown; body?: unknown; countrySlug?: unknown }): Promise<EntryComment> {
  const slug = cleanSlug(entrySlug);
  if (!slug) throw new Error("Missing entry slug.");
  const comment: EntryComment = {
    id: randomUUID(),
    entry_slug: slug,
    country_slug: input.countrySlug ? cleanSlug(String(input.countrySlug)) || null : null,
    author_name: cleanName(input.name),
    body: cleanBody(input.body),
    created_at: new Date().toISOString(),
  };
  if (!hasSupabase) return publicComment(intoMemory(comment));
  try {
    return publicComment(await insertComment(comment));
  } catch (error) {
    if (tableMissing(error)) return publicComment(intoMemory(comment));
    throw error;
  }
}
