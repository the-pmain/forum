import { COUNTRIES } from "@shared/constants.ts";
import type { DirectoryView, Provider } from "@shared/types.ts";
import { providerURL } from "@shared/filter.ts";

export function initials(name: string): string {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function displayDate(value?: string, fallback = "Not set"): string {
  if (!value) return fallback;
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function badgeClass(status: string): string {
  return ({ Listed: "listed", Check: "check", Limited: "limited", Restricted: "restricted", Mixed: "mixed" } as Record<string, string>)[status] || "neutral";
}

export function loanAmountLabel(type?: string): string {
  if (type === "Credit card") return "loan.cardAmount";
  if (type === "Card instalments") return "loan.instalment";
  if (type === "Overdraft / credit line") return "loan.facility";
  return "loan.application";
}

export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportCsv(records: Provider[], view: DirectoryView) {
  const withLimits = view.category === "Ramps";
  const withLoans = records.some((item) => item.category === "Loans & credit");
  const headers = [
    "Provider / product",
    "Category",
    "Country profile records",
    "Country flags",
    "Age eligibility",
    "Upper-age evidence",
    "Upper-age qualification",
    "Limitations",
    "Your notes",
    "Website / source",
    "Local country websites",
  ];
  if (withLimits) headers.push("Minimum payment / purchase", "Maximum payment / purchase");
  if (withLoans) {
    headers.push(
      "Lender",
      "Borrowing type",
      "Minimum application / balance",
      "Amount basis",
      "Currency",
      "Collateral",
      "Application route",
      "Decision timing",
      "Payout timing",
      "Funding label",
      "Application requirements",
      "Final repayment age",
      "Pension rules",
      "Repayment structure",
      "Term",
      "Interest / fees",
      "Small-credit group",
    );
  }
  headers.push("Age / product sources", "Country / service sources", "Source review date", "Review scope");

  const rows = records.map((provider) => {
    const countries = COUNTRIES.filter((country) => provider.countries[country] && (view.country === "all" || view.country === country));
    const row: unknown[] = [
      provider.name,
      provider.category,
      countries.join("; "),
      countries.map((country) => `${country}: ${provider.countries[country]?.status}`).join("; "),
      view.country === "all" ? provider.ageEligibility : provider.countries[view.country]?.age || provider.ageEligibility,
      provider.upperAgeStatus,
      provider.upperAge,
      provider.limitations,
      provider.notes,
      providerURL(provider, view.country),
      countries.filter((country) => provider.countries[country]?.url).map((country) => `${country}: ${provider.countries[country]?.url}`).join("\n"),
    ];
    if (withLimits) row.push(provider.minPayment, provider.maxPayment);
    if (withLoans) {
      const lending = (provider.lending || {}) as Record<string, unknown>;
      row.push(
        ...["lender", "type", "minimum", "minimumBasis", "currency", "security", "channel", "decision", "payout", "speed", "eligibility", "payoffAge", "retirement", "repayment", "term", "costs"].map(
          (key) => lending[key] || "",
        ),
        lending.smallCredit ? "Yes" : "",
      );
    }
    row.push(provider.sources.age.join("\n"), provider.sources.service.join("\n"), provider.sourceDate, provider.reviewNote);
    return row;
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const blob = new Blob(["\ufeff" + [headers, ...rows].map((line) => line.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `financial-navigator-view-${stamp}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}

export function downloadJson(payload: unknown, name: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}

export function hostName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
