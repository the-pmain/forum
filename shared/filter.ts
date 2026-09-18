import { CARD_PACK_IDS, CATEGORY_INFO, PAGE_SIZE } from "./constants.ts";
import type { DirectoryView, Provider } from "./types.ts";
import { fold } from "./workspace.ts";

export function categoryInfo(name: string) {
  return CATEGORY_INFO.find((item) => item.name === name) ?? CATEGORY_INFO[0];
}

export function countryStatus(provider: Provider, country: DirectoryView["country"]): string {
  if (country !== "all") return provider.countries[country]?.status || "Not in source";
  const unique = [...new Set(Object.values(provider.countries).map((item) => item.status))];
  return unique.length === 1 ? unique[0] : "Mixed";
}

export function filterRecords(records: Provider[], view: DirectoryView, favorites: string[], ignoreCategory = false): Provider[] {
  const filtered = records.filter((provider) => {
    if (view.mode === "favorites" && !favorites.includes(provider.id)) return false;
    if (view.country !== "all" && !provider.countries[view.country]) return false;
    if (!ignoreCategory && view.category !== "all" && provider.category !== view.category) return false;
    if (view.status !== "all") {
      const statuses = view.country === "all"
        ? Object.values(provider.countries).map((item) => item.status)
        : [provider.countries[view.country]?.status];
      if (!statuses.includes(view.status)) return false;
    }
    if (view.upper !== "all" && provider.upperAgeStatus !== view.upper) return false;
    if (!ignoreCategory && view.category === "Loans & credit") {
      const lending = provider.lending;
      if (view.loanType !== "all" && lending?.type !== view.loanType) return false;
      if (view.loanSecurity !== "all" && lending?.security !== view.loanSecurity) return false;
      if (view.loanSpeed !== "all" && lending?.speed !== view.loanSpeed) return false;
      if (view.loanMinimum === "published" && lending?.minimumValue == null) return false;
      if (view.loanMinimum === "small" && !lending?.smallCredit) return false;
      if (view.loanMinimum === "new" && !CARD_PACK_IDS.includes(provider.id as (typeof CARD_PACK_IDS)[number])) return false;
    }
    const query = fold(view.query).trim();
    if (query) {
      const hay = fold([
        provider.name,
        provider.category,
        provider.service,
        provider.countryFocus,
        provider.limitations,
        provider.ageEligibility,
        provider.upperAge,
        provider.notes,
        provider.minPayment || "",
        provider.maxPayment || "",
        ...Object.values(provider.lending || {}),
        ...Object.entries(provider.countries).map(([country, entry]) => `${country} ${entry.note}`),
      ].join(" "));
      if (!query.split(/\s+/).every((token) => hay.includes(token))) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (view.sort === "updated") return (b.updatedAt || "").localeCompare(a.updatedAt || "") || a.name.localeCompare(b.name);
    if (view.sort === "za") return b.name.localeCompare(a.name);
    return a.name.localeCompare(b.name);
  });
  return filtered;
}

export function paginate<T>(records: T[], page: number): { page: number; pages: number; start: number; visible: T[] } {
  const pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * PAGE_SIZE;
  return { page: safePage, pages, start, visible: records.slice(start, start + PAGE_SIZE) };
}

export function providerURL(provider: Provider, country: DirectoryView["country"]): string {
  return safeUrlForView(country !== "all" && provider.countries[country]?.url ? provider.countries[country]!.url : provider.website);
}

function safeUrlForView(value?: string): string {
  try {
    const url = new URL(String(value || "").trim());
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}
