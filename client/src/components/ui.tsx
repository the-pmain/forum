import { COUNTRIES, CODES } from "@shared/constants.ts";
import type { Country, Provider } from "@shared/types.ts";
import { countryStatus } from "@shared/filter.ts";
import { useI18n } from "../i18n/context.tsx";
import { badgeClass } from "../lib/utils.ts";

export function Badge({ status }: { status: string }) {
  const { t } = useI18n();
  const key = `badges.${status}`;
  const label = t(key);
  return <span className={`pill ${badgeClass(status)}`}>{label === key ? status : label}</span>;
}

export function MarketChips({ provider, country }: { provider: Provider; country: "all" | Country }) {
  return (
    <div className="market-chips" aria-label="Country profile records">
      {COUNTRIES.filter((item) => provider.countries[item]).map((item) => (
        <span key={item} className={`market-chip${country === item ? " focus" : ""}`} title={`${item}: ${provider.countries[item]?.status} in directory`}>
          {CODES[item]}
        </span>
      ))}
    </div>
  );
}

export function StatusBadge({ provider, country }: { provider: Provider; country: "all" | Country }) {
  return <Badge status={countryStatus(provider, country)} />;
}
