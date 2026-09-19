import { COUNTRIES, CODES } from "@shared/constants.ts";
import type { Country, Provider } from "@shared/types.ts";
import { safeURL } from "@shared/workspace.ts";
import { useI18n } from "../i18n/context.tsx";
import { Icon } from "../lib/icons.tsx";
import { hostName } from "../lib/utils.ts";
import { Badge } from "./ui.tsx";

export function SourceList({ links, empty }: { links: string[]; empty: string }) {
  if (!links.length) return <p>{empty}</p>;
  return (
    <ul className="source-list">
      {links.map((url) => (
        <li key={url}>
          <a href={safeURL(url)} target="_blank" rel="noopener noreferrer">
            <Icon name="external" />
            <span><span className="source-host">{hostName(url)}</span><span className="source-url">{url}</span></span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function MiningDetails({ provider }: { provider: Provider }) {
  const { t } = useI18n();
  const mining = provider.mining!;
  return (
    <>
      <div className="loan-detail-head">
        <span className="loan-kind">{mining.productType}</span>
        <span className={`pill rating-${mining.withdrawalRating.toLowerCase()}`}>{mining.withdrawalRating.replace("_", " / ")}</span>
      </div>
      <section className="detail-section">
        <div className="limit-box loan-limit">
          <strong>{t("mining.payout")}</strong>
          <p>{mining.payoutMethod}</p>
          <span className="small muted">{t(`mining.speedLabel.${mining.withdrawalSpeed}`)} · {mining.instantWithdrawal}</span>
        </div>
      </section>
      <div className="age-grid">
        <div className="detail-stat"><span>{t("mining.rewards")}</span><strong>{mining.rewards}</strong></div>
        <div className="detail-stat"><span>{t("mining.kyc")}</span><strong>{mining.kyc}</strong></div>
      </div>
      <div className="callout warning loan-risk"><Icon name="info" />{t("mining.note")}</div>
      <section className="detail-section"><h3>{t("mining.wallet")}</h3><p>{mining.externalWallet ? t("mining.external") : t("mining.custodial")}{mining.nonCustodial ? ` · ${t("mining.selfCustody")}` : ""}</p></section>
      <section className="detail-section"><h3>{t("mining.rules")}</h3><p>{mining.withdrawalRules}</p></section>
      <section className="detail-section"><h3>{t("mining.holding")}</h3><p>{mining.holdingRestrictions}</p></section>
      <section className="detail-section"><h3>{t("mining.bestFor")}</h3><p>{mining.bestFor}</p></section>
    </>
  );
}

export function LendingDetails({ provider }: { provider: Provider }) {
  const { t } = useI18n();
  const lending = provider.lending!;
  const secured = lending.security !== "Unsecured";
  return (
    <>
      <div className="loan-detail-head">
        <span className="loan-kind">{lending.type}</span>
        <span className="small muted">{lending.currency} · {lending.channel}</span>
      </div>
      <section className="detail-section">
        <div className="limit-box loan-limit">
          <strong>{t("loan.minBox")}</strong>
          <p>{lending.minimum || "Not verified"}</p>
          <span className="small muted">{lending.minimumBasis}</span>
        </div>
        <p className="tiny">{t("loan.minNote")}</p>
      </section>
      <div className="age-grid">
        <div className="detail-stat"><span>{t("loan.appAge")}</span><strong>{provider.ageEligibility}</strong></div>
        <div className="detail-stat"><span>{t("loan.payoff")}</span><strong>{lending.payoffAge || "Not verified"}</strong></div>
      </div>
      <section className="detail-section"><h3>{t("loan.decision")}</h3><p>{lending.decision || t("loan.fallback")}</p></section>
      <section className="detail-section"><h3>{t("loan.payout")}</h3><p>{lending.payout || t("loan.fallback")}</p></section>
      <div className={`callout ${secured ? "danger" : "warning"} loan-risk`}><Icon name="info" />{secured ? t("loan.secured") : t("loan.unsecured")}</div>
      <section className="detail-section"><h3>{t("loan.eligibility")}</h3><p>{lending.eligibility || t("loan.fallback")}</p></section>
      <section className="detail-section"><h3>{t("loan.costs")}</h3><p>{lending.costs || t("loan.fallback")}</p></section>
      <div className="callout loan-cost-note">{t("loan.costNote")}</div>
    </>
  );
}

export function ProviderRecord({
  provider,
  tab,
  country = "all",
}: {
  provider: Provider;
  tab: "overview" | "age" | "sources";
  country?: "all" | Country;
}) {
  const { t } = useI18n();
  if (tab === "age") {
    return (
      <>
        <div className="age-grid">
          <div className="detail-stat"><span>{t("loan.appAge")}</span><strong>{provider.ageEligibility}</strong><p>{provider.ageEvidence}</p></div>
          <div className="detail-stat"><span>{t("detail.upperCheck")}</span><strong>{provider.upperAgeStatus}</strong></div>
        </div>
        <section className="detail-section"><h3>{t("form.upperRule")}</h3><p>{provider.upperAge}</p></section>
        <section className="detail-section"><h3>{t("form.ageNotes")}</h3><p>{provider.ageNotes || t("detail.noNotes")}</p></section>
        <SourceList links={provider.sources.age} empty={t("detail.noSource")} />
      </>
    );
  }
  if (tab === "sources") {
    return (
      <>
        <section className="detail-section"><h3>{t("form.ageSources")}</h3><SourceList links={provider.sources.age} empty={t("detail.noSource")} /></section>
        <section className="detail-section"><h3>{t("form.serviceSources")}</h3><SourceList links={provider.sources.service} empty={t("detail.noSource")} /></section>
        <section className="detail-section"><h3>{t("form.review")}</h3><p>{provider.reviewNote}</p></section>
      </>
    );
  }
  return (
    <>
      <section className="detail-section"><h3>{t("detail.glance")}</h3><p>{provider.service || provider.countryFocus || t("detail.noDescription")}</p></section>
      {provider.lending ? <LendingDetails provider={provider} /> : null}
      {provider.mining ? <MiningDetails provider={provider} /> : null}
      <section className="detail-section"><h3>{t("detail.limits")}</h3><p>{provider.limitations || t("detail.noLimits")}</p></section>
      {provider.category === "Ramps" ? (
        <section className="detail-section">
          <h3>{t("detail.rampLimits")}</h3>
          <div className="limit-box"><strong>{t("detail.minPay")}</strong><p>{provider.minPayment || "Not verified"}</p></div>
          <div className="limit-box"><strong>{t("detail.maxPay")}</strong><p>{provider.maxPayment || "Not verified"}</p></div>
        </section>
      ) : null}
      <section className="detail-section">
        <div className="section-top"><h3>{t("detail.upperCheck")}</h3><Badge status={provider.upperAgeStatus} /></div>
        <p>{provider.upperAge}</p>
      </section>
      <section className="detail-section">
        <h3>{t("detail.profiles")}</h3>
        <p className="tiny muted" style={{ marginBottom: 12 }}>{t("detail.profilesHint")}</p>
        {COUNTRIES.map((item) => {
          const entry = provider.countries[item];
          const url = entry?.url ? safeURL(entry.url) : "";
          return (
            <div key={item} className={`country-entry${country === item ? " focus" : ""}${entry ? "" : " absent"}`}>
              <div className="country-entry-top">
                <div className="country-name-inline"><span className="country-code">{CODES[item]}</span><strong>{item}</strong></div>
                {entry ? <Badge status={entry.status} /> : <span className="pill neutral">{t("badges.none")}</span>}
              </div>
              <p>{entry ? entry.note || t("detail.noNote") : t("detail.absent")}</p>
              {url ? <a className="local-bank-link" href={url} target="_blank" rel="noopener noreferrer"><Icon name="external" />{t("detail.openSite", { country: item })}</a> : null}
            </div>
          );
        })}
      </section>
      <section className="detail-section">
        <div className="section-top"><h3>{t("detail.notes")}</h3></div>
        <p className={provider.notes ? "" : "notes-empty"}>{provider.notes || t("detail.noNotes")}</p>
      </section>
    </>
  );
}
