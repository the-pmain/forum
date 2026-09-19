import {
  AGE_EVIDENCE,
  BANK_PACK_ID,
  CARD_PACK_ID,
  CARD_PACK_IDS,
  CATEGORIES,
  COUNTRIES,
  LOAN_PACK_ID,
  LOAN_SECURITY,
  LOAN_SPEED,
  LOAN_TEXT_KEYS,
  LOAN_TYPES,
  MINING_PACK_ID,
  MINING_TEXT_KEYS,
  NL_CREDIT_PACK_ID,
  EUROPE_CREDIT_PACK_ID,
  P2P_PACK_ID,
  P2P_TEXT_KEYS,
  PUBLICATION_STATUSES,
  STATUSES,
  UPPER_STATUSES,
  WITHDRAWAL_RATINGS,
  WITHDRAWAL_SPEEDS,
} from "./constants.ts";
import type { Lending, Mining, P2p, Provider, Workspace } from "./types.ts";

export function fold(value: unknown): string {
  return String(value || "")
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function safeURL(value: unknown): string {
  try {
    const url = new URL(String(value).trim());
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

function text(value: unknown, max = 30000): string {
  if (value == null) return "";
  if (typeof value !== "string") throw new Error("A text field has an invalid type.");
  if (value.length > max) throw new Error("A text field is too long.");
  return value;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function normaliseLending(raw: unknown): Lending {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("A borrowing product needs its lending details.");
  }
  const source = raw as Record<string, unknown>;
  const out = {} as Lending;
  for (const key of LOAN_TEXT_KEYS) {
    (out as unknown as Record<string, unknown>)[key] = text(source[key], 30000);
  }
  if (!LOAN_TYPES.includes(out.type)) throw new Error("Select a supported borrowing product type.");
  if (!LOAN_SECURITY.includes(out.security)) throw new Error("Select whether the borrowing is secured.");
  if (!LOAN_SPEED.includes(out.speed)) throw new Error("Select a supported decision / funding label.");
  if (source.minimumValue == null || source.minimumValue === "") out.minimumValue = null;
  else {
    if (typeof source.minimumValue !== "number" || !Number.isFinite(source.minimumValue) || source.minimumValue < 0) {
      throw new Error("The optional minimum amount must be a non-negative number.");
    }
    out.minimumValue = source.minimumValue;
  }
  out.smallCredit = source.smallCredit === true;
  return out;
}

export function normaliseMining(raw: unknown): Mining {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("A mining product needs its withdrawal details.");
  }
  const source = raw as Record<string, unknown>;
  const out = {} as Mining;
  for (const key of MINING_TEXT_KEYS) {
    (out as unknown as Record<string, unknown>)[key] = text(source[key], 30000);
  }
  if (!WITHDRAWAL_SPEEDS.includes(source.withdrawalSpeed as Mining["withdrawalSpeed"])) {
    throw new Error("Select a supported mining withdrawal-speed label.");
  }
  if (!WITHDRAWAL_RATINGS.includes(source.withdrawalRating as Mining["withdrawalRating"])) {
    throw new Error("Select a supported mining withdrawal rating.");
  }
  out.withdrawalSpeed = source.withdrawalSpeed as Mining["withdrawalSpeed"];
  out.withdrawalRating = source.withdrawalRating as Mining["withdrawalRating"];
  out.externalWallet = source.externalWallet === true;
  out.nonCustodial = source.nonCustodial === true;
  return out;
}

export function normaliseP2p(raw: unknown): P2p {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("A P2P product needs its marketplace details.");
  }
  const source = raw as Record<string, unknown>;
  const out = {} as P2p;
  for (const key of P2P_TEXT_KEYS) {
    (out as unknown as Record<string, unknown>)[key] = text(source[key], 30000);
  }
  out.directDelivery = source.directDelivery === true;
  out.externalWallet = source.externalWallet === true;
  out.nonCustodial = source.nonCustodial === true;
  return out;
}

export function normaliseProvider(raw: unknown): Provider {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid provider record.");
  const source = raw as Record<string, unknown>;
  const provider: Provider = {
    id: text(source.id, 160),
    name: text(source.name, 120).trim(),
    category: text(source.category, 50) as Provider["category"],
    website: text(source.website, 3000),
    service: text(source.service, 500),
    countryFocus: text(source.countryFocus),
    countries: {},
    limitations: text(source.limitations),
    ageEligibility: text(source.ageEligibility, 1000),
    ageEvidence: text(source.ageEvidence, 100) as Provider["ageEvidence"],
    ageNotes: text(source.ageNotes),
    upperAge: text(source.upperAge),
    upperAgeStatus: text(source.upperAgeStatus, 100) as Provider["upperAgeStatus"],
    sources: { age: [], service: [] },
    reviewNote: text(source.reviewNote),
    sourceDate: text(source.sourceDate, 30),
    origin: text(source.origin, 200),
    notes: text(source.notes),
    updatedAt: text(source.updatedAt, 100),
    publicationStatus: PUBLICATION_STATUSES.includes(source.publicationStatus as Provider["publicationStatus"])
      ? source.publicationStatus as Provider["publicationStatus"]
      : "publish",
    tags: Array.isArray(source.tags)
      ? [...new Set(source.tags.filter((item): item is string => typeof item === "string" && item.length <= 80))].slice(0, 40)
      : [],
  };
  if (!provider.id || !provider.name || !CATEGORIES.includes(provider.category)) {
    throw new Error("Every provider needs a unique ID, a name and a supported category.");
  }
  if (provider.website && !safeURL(provider.website)) {
    throw new Error(`Invalid website link for ${provider.name}. Only http(s) links are accepted.`);
  }
  if (!UPPER_STATUSES.includes(provider.upperAgeStatus)) {
    throw new Error(`Unrecognised upper-age status for ${provider.name}.`);
  }
  if (!AGE_EVIDENCE.includes(provider.ageEvidence)) {
    throw new Error(`Unrecognised age-evidence label for ${provider.name}.`);
  }
  if (!source.countries || typeof source.countries !== "object" || Array.isArray(source.countries)) {
    throw new Error(`Missing country records for ${provider.name}.`);
  }
  for (const [country, value] of Object.entries(source.countries as Record<string, { status?: string; note?: unknown; age?: unknown; url?: unknown }>)) {
    if (!COUNTRIES.includes(country as (typeof COUNTRIES)[number]) || !value || !STATUSES.includes(value.status as (typeof STATUSES)[number])) {
      throw new Error(`Invalid country or status for ${provider.name}.`);
    }
    provider.countries[country as (typeof COUNTRIES)[number]] = {
      status: value.status as (typeof STATUSES)[number],
      note: text(value.note),
      age: text(value.age, 1000),
    };
    if (value.url) {
      const url = text(value.url, 3000);
      if (!safeURL(url)) throw new Error(`Invalid local website for ${provider.name} in ${country}.`);
      provider.countries[country as (typeof COUNTRIES)[number]]!.url = url;
    }
  }
  if (!Object.keys(provider.countries).length) {
    throw new Error(`At least one country profile is required for ${provider.name}.`);
  }
  if (!source.sources || typeof source.sources !== "object") {
    throw new Error(`Missing source structure for ${provider.name}.`);
  }
  const sources = source.sources as Record<string, unknown>;
  for (const type of ["age", "service"] as const) {
    const links = sources[type];
    if (!Array.isArray(links) || links.length > 100) throw new Error(`Invalid source list for ${provider.name}.`);
    provider.sources[type] = [...new Set(links.map((item) => {
      const link = text(item, 5000).trim();
      if (!safeURL(link)) throw new Error(`Invalid source link for ${provider.name}.`);
      return link;
    }))];
  }
  if (provider.category === "Ramps") {
    provider.minPayment = text(source.minPayment);
    provider.maxPayment = text(source.maxPayment);
  }
  if (provider.category === "Loans & credit") provider.lending = normaliseLending(source.lending);
  if (provider.category === "Mining Solutions") provider.mining = normaliseMining(source.mining);
  if (provider.category === "P2P" && source.p2p) provider.p2p = normaliseP2p(source.p2p);
  if (source.providerGroupId) provider.providerGroupId = text(source.providerGroupId, 120);
  if (source.deletedAt) provider.deletedAt = text(source.deletedAt, 100);
  provider.verified = source.verified === true;
  provider.hidden = source.hidden === true;
  return provider;
}

export function normaliseWorkspace(raw: unknown, workspaceId: string): Workspace {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("This is not a compatible Financial Navigator backup (version 1).");
  }
  const source = raw as Record<string, unknown>;
  if (source.schemaVersion !== 1 || source.app !== "Financial Navigator") {
    throw new Error("This is not a compatible Financial Navigator backup (version 1).");
  }
  if (!Array.isArray(source.providers) || source.providers.length > 2000 || !Array.isArray(source.trash) || source.trash.length > 2000) {
    throw new Error("The backup has invalid record lists or exceeds 2,000 records per list.");
  }
  const scopeList = (list: unknown[]) =>
    list
      .map((item) => {
        if (!item || typeof item !== "object" || !("countries" in item) || typeof item.countries !== "object" || !item.countries) return item;
        const next = clone(item) as { countries?: Record<string, unknown> };
        if (next.countries) delete next.countries.Iceland;
        return next;
      })
      .filter((item) => !item || typeof item !== "object" || !("countries" in item) || !item.countries || Object.keys(item.countries as object).length);

  const providers = scopeList(source.providers).map(normaliseProvider);
  const trash = scopeList(source.trash).map(normaliseProvider);
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const provider of [...providers, ...trash]) {
    if (ids.has(provider.id)) throw new Error("The backup contains duplicate provider IDs.");
    ids.add(provider.id);
  }
  for (const provider of providers) {
    const key = fold(provider.name);
    if (names.has(key)) throw new Error("The backup has duplicate active provider names.");
    names.add(key);
  }
  if (!Array.isArray(source.favorites) || source.favorites.some((item) => typeof item !== "string")) {
    throw new Error("Invalid saved-provider list.");
  }
  return {
    schemaVersion: 1,
    app: "Financial Navigator",
    workspaceId,
    sourceFile: text(source.sourceFile, 300),
    sourceNote: text(source.sourceNote),
    countries: [...COUNTRIES],
    appliedPacks: Array.isArray(source.appliedPacks)
      ? [...new Set(source.appliedPacks.filter((item): item is string => typeof item === "string" && item.length <= 150))]
      : [],
    providers,
    trash,
    favorites: [...new Set(source.favorites as string[])].filter((id) => ids.has(id)),
    lastSaved: source.lastSaved ? text(source.lastSaved, 100) : null,
    revision: Number.isSafeInteger(source.revision) && (source.revision as number) >= 0 ? (source.revision as number) : 0,
  };
}

export function ensurePacks(workspace: Workspace, seed: Workspace): Workspace {
  const next = clone(workspace);
  next.appliedPacks = Array.isArray(next.appliedPacks) ? next.appliedPacks : [];
  const existing = [...next.providers, ...next.trash];
  const ids = new Set(existing.map((item) => item.id));
  const names = new Set(existing.map((item) => fold(item.name)));

  const addMissing = (candidates: Provider[]) => {
    for (const provider of candidates) {
      if (!ids.has(provider.id) && !names.has(fold(provider.name))) {
        next.providers.push(clone(provider));
        ids.add(provider.id);
        names.add(fold(provider.name));
      }
    }
  };

  if (!next.appliedPacks.includes(BANK_PACK_ID)) {
    addMissing(seed.providers.filter((item) => item.category === "High-street banks"));
    next.appliedPacks.push(BANK_PACK_ID);
  }
  if (!next.appliedPacks.includes(LOAN_PACK_ID)) {
    addMissing(seed.providers.filter((item) => item.category === "Loans & credit"));
    next.appliedPacks.push(LOAN_PACK_ID);
  }
  if (!next.appliedPacks.includes(CARD_PACK_ID)) {
    addMissing(seed.providers.filter((item) => CARD_PACK_IDS.includes(item.id as (typeof CARD_PACK_IDS)[number])));
    next.appliedPacks.push(CARD_PACK_ID);
  }
  if (!next.appliedPacks.includes(NL_CREDIT_PACK_ID)) {
    addMissing(seed.providers.filter((item) => item.origin === "nl-consumer-credit/1.0"));
    next.appliedPacks.push(NL_CREDIT_PACK_ID);
  }
  if (!next.appliedPacks.includes(EUROPE_CREDIT_PACK_ID)) {
    addMissing(seed.providers.filter((item) => item.origin === "europe-consumer-credit/1.0"));
    next.appliedPacks.push(EUROPE_CREDIT_PACK_ID);
  }
  if (!next.appliedPacks.includes(MINING_PACK_ID)) {
    addMissing(seed.providers.filter((item) => item.origin === "mining-solutions-europe/1.0"));
    next.appliedPacks.push(MINING_PACK_ID);
  }
  if (!next.appliedPacks.includes(P2P_PACK_ID)) {
    addMissing(seed.providers.filter((item) => item.origin === "finance-directory-p2p/1.0"));
    next.appliedPacks.push(P2P_PACK_ID);
  }
  return next;
}

export function mergeWorkspaces(current: Workspace, incoming: Workspace): Workspace {
  const map = new Map(current.providers.map((item) => [item.id, item]));
  for (const provider of incoming.providers) map.set(provider.id, provider);
  const incomingIds = new Set(incoming.providers.map((item) => item.id));
  return {
    ...current,
    providers: [...map.values()],
    trash: current.trash.filter((item) => !incomingIds.has(item.id)),
    favorites: [...new Set([...current.favorites, ...incoming.favorites])].filter(
      (id) => map.has(id) || current.trash.some((item) => item.id === id),
    ),
  };
}

export function newProviderId(): string {
  return `p-${typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
}
