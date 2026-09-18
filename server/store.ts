import seedJson from "../data/seed.json" with { type: "json" };
import { WORKSPACE_ID } from "../shared/constants.ts";
import type { Provider, Workspace } from "../shared/types.ts";
import { ensurePacks, fold, mergeWorkspaces, normaliseProvider, normaliseWorkspace } from "../shared/workspace.ts";
import { hasSupabase } from "./config.ts";
import { fetchWorkspaceRow, upsertWorkspaceRow } from "./supabase.ts";

const seed = normaliseWorkspace(seedJson, WORKSPACE_ID);
let memory = structuredClone(seed);

async function readWorkspace(): Promise<Workspace> {
  if (!hasSupabase) return structuredClone(memory);
  const row = await fetchWorkspaceRow(WORKSPACE_ID);
  if (!row) {
    const initial = ensurePacks(structuredClone(seed), seed);
    await upsertWorkspaceRow(WORKSPACE_ID, initial);
    return initial;
  }
  return ensurePacks(normaliseWorkspace(row.payload, WORKSPACE_ID), seed);
}

async function writeWorkspace(workspace: Workspace): Promise<Workspace> {
  const next = {
    ...workspace,
    lastSaved: new Date().toISOString(),
    revision: workspace.revision + 1,
  };
  if (hasSupabase) await upsertWorkspaceRow(WORKSPACE_ID, next);
  else memory = structuredClone(next);
  return next;
}

export async function getWorkspace(includeTrash: boolean): Promise<Workspace> {
  const workspace = await readWorkspace();
  if (includeTrash) return workspace;
  return { ...workspace, trash: [] };
}

export async function saveProvider(input: unknown, existingId?: string): Promise<Workspace> {
  const workspace = await readWorkspace();
  const record = normaliseProvider(input);
  if (existingId && existingId !== record.id) throw new Error("Provider ID cannot change.");
  const duplicate = workspace.providers.some((item) => item.id !== record.id && fold(item.name) === fold(record.name));
  if (duplicate) throw new Error("A provider with this name is already in the directory.");
  if (existingId) {
    if (!workspace.providers.some((item) => item.id === existingId)) throw new Error("Provider not found.");
    workspace.providers = workspace.providers.map((item) => (item.id === existingId ? record : item));
  } else {
    workspace.providers.push(record);
  }
  return writeWorkspace(workspace);
}

export async function moveToTrash(id: string): Promise<Workspace> {
  const workspace = await readWorkspace();
  const provider = workspace.providers.find((item) => item.id === id);
  if (!provider) throw new Error("Provider not found.");
  workspace.providers = workspace.providers.filter((item) => item.id !== id);
  workspace.trash.push({ ...provider, deletedAt: new Date().toISOString() });
  return writeWorkspace(workspace);
}

export async function restoreProvider(id: string): Promise<Workspace> {
  const workspace = await readWorkspace();
  const provider = workspace.trash.find((item) => item.id === id);
  if (!provider) throw new Error("Provider not found in trash.");
  if (workspace.providers.some((item) => fold(item.name) === fold(provider.name))) {
    throw new Error("A provider with this name already exists. Rename that record before restoring.");
  }
  const restored = { ...provider };
  delete restored.deletedAt;
  workspace.providers.push(restored);
  workspace.trash = workspace.trash.filter((item) => item.id !== id);
  return writeWorkspace(workspace);
}

export async function permanentDelete(id: string): Promise<Workspace> {
  const workspace = await readWorkspace();
  workspace.trash = workspace.trash.filter((item) => item.id !== id);
  workspace.favorites = workspace.favorites.filter((item) => item !== id);
  return writeWorkspace(workspace);
}

export async function emptyTrash(): Promise<Workspace> {
  const workspace = await readWorkspace();
  const ids = new Set(workspace.trash.map((item) => item.id));
  workspace.trash = [];
  workspace.favorites = workspace.favorites.filter((item) => !ids.has(item));
  return writeWorkspace(workspace);
}

export async function importWorkspace(raw: unknown, mode: "merge" | "replace" | "upgrade"): Promise<Workspace> {
  const incoming = normaliseWorkspace(raw, WORKSPACE_ID);
  const current = await readWorkspace();
  let next: Workspace;
  if (mode === "merge") next = mergeWorkspaces(current, incoming);
  else if (mode === "upgrade") next = ensurePacks(incoming, seed);
  else next = incoming;
  return writeWorkspace(next);
}

export async function exportWorkspace(): Promise<Workspace> {
  return readWorkspace();
}

export function publicise(workspace: Workspace, includeTrash: boolean): Workspace {
  return {
    ...workspace,
    trash: includeTrash ? workspace.trash : [],
    favorites: includeTrash ? workspace.favorites : [],
  };
}

export function findProvider(workspace: Workspace, id: string): Provider | undefined {
  return workspace.providers.find((item) => item.id === id) || workspace.trash.find((item) => item.id === id);
}
