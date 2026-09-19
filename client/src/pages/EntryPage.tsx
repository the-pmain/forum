import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  AGE_EVIDENCE,
  CATEGORIES,
  CODES,
  COUNTRIES,
  FAVORITES_KEY,
  LOAN_SECURITY,
  LOAN_TYPES,
  PUBLICATION_STATUSES,
  STATUSES,
  UPPER_STATUSES,
  WITHDRAWAL_RATINGS,
  WITHDRAWAL_SPEEDS,
} from "@shared/constants.ts";
import type { Category, Country, DirectoryView, Lending, Mining, Provider, Status, Workspace } from "@shared/types.ts";
import { newProviderId, normaliseProvider } from "@shared/workspace.ts";
import { useI18n, withLocale } from "../i18n/context.tsx";
import { api } from "../lib/api.ts";
import { Icon } from "../lib/icons.tsx";

function emptyProvider(country: DirectoryView["country"], category: DirectoryView["category"]): Provider {
  return {
    id: newProviderId(),
    name: "",
    category: category === "all" ? "Loans & credit" : category,
    website: "",
    service: "",
    countryFocus: "",
    countries: country === "all" ? {} : { [country]: { status: "Check", note: "", age: "" } },
    limitations: "",
    ageEligibility: "Not verified",
    ageEvidence: "Not verified",
    ageNotes: "",
    upperAge: "Not verified; confirm the applicable account and product rules.",
    upperAgeStatus: "Not verified",
    sources: { age: [], service: [] },
    reviewNote: "User-entered record. Confirm country and product eligibility with the provider.",
    sourceDate: "",
    origin: "User-added",
    notes: "",
    updatedAt: "",
    publicationStatus: "publish",
    tags: [],
    verified: false,
    hidden: false,
  };
}

function defaultLending(): Lending {
  return {
    lender: "",
    type: "Personal loan",
    minimum: "",
    minimumBasis: "Loan application amount",
    currency: "",
    channel: "",
    decision: "",
    payout: "",
    speed: "Standard / not verified",
    security: "Unsecured",
    eligibility: "",
    payoffAge: "Not verified",
    retirement: "Not verified",
    costs: "",
    term: "",
    repayment: "",
    minimumValue: null,
    smallCredit: false,
  };
}

function defaultMining(): Mining {
  return {
    productType: "",
    rewards: "BTC",
    kyc: "",
    externalWallet: true,
    nonCustodial: true,
    withdrawalSpeed: "instant_fast",
    withdrawalRating: "YELLOW",
    instantWithdrawal: "",
    payoutMethod: "",
    withdrawalRules: "",
    holdingRestrictions: "",
    bestFor: "",
  };
}

function readFavorites(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function EntryPage({
  workspace,
  setWorkspace,
  admin,
}: {
  workspace: Workspace;
  setWorkspace: (workspace: Workspace) => void;
  admin: boolean;
}) {
  const { t, locale } = useI18n();
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const existing = id ? workspace.providers.find((item) => item.id === id) || null : null;
  const start = useMemo(
    () => existing ?? emptyProvider((params.get("country") as DirectoryView["country"]) || "all", (params.get("category") as DirectoryView["category"]) || "Loans & credit"),
    [existing, params],
  );
  const [draft, setDraft] = useState<Provider>(start);
  const [favorite, setFavorite] = useState(Boolean(existing && readFavorites().includes(existing.id)));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(start);
    setFavorite(Boolean(existing && readFavorites().includes(existing.id)));
    setError("");
  }, [start, existing]);

  const lending = draft.lending || defaultLending();
  const mining = draft.mining || defaultMining();
  const missing = Boolean(id && !existing);

  function setField<K extends keyof Provider>(key: K, value: Provider[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setCountry(name: Country, status: "" | Status) {
    setDraft((current) => {
      const countries = { ...current.countries };
      if (!status) delete countries[name];
      else countries[name] = { status, note: countries[name]?.note || "", age: countries[name]?.age || "", url: countries[name]?.url };
      return { ...current, countries };
    });
  }

  async function submit() {
    if (!admin) {
      setError(t("form.adminOnly"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const record = normaliseProvider({
        ...draft,
        lending: draft.category === "Loans & credit" ? lending : undefined,
        mining: draft.category === "Mining Solutions" ? mining : undefined,
        updatedAt: new Date().toISOString(),
        origin: draft.origin || "User-added",
      });
      const response = existing ? await api.updateProvider(record) : await api.createProvider(record);
      setWorkspace(response.workspace);
      const next = existing ? readFavorites().filter((item) => item !== record.id) : readFavorites();
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorite ? [...new Set([...next, record.id])] : next.filter((item) => item !== record.id)));
      navigate(withLocale(locale, "/"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.adminOnly"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="entry-page">
      <header className="entry-topbar">
        <Link className="btn" to={withLocale(locale, "/")}>
          <Icon name="left" /> {t("form.back")}
        </Link>
        <div className="entry-topbar-title">
          <div className="eyebrow">{t("detail.record")}</div>
          <h1>{existing ? t("form.edit") : t("form.add")}</h1>
        </div>
        <div className="entry-topbar-actions">
          <Link className="btn" to={withLocale(locale, "/")}>{t("form.cancel")}</Link>
          <button className="btn btn-primary" type="button" disabled={!admin || busy} onClick={submit}>
            <Icon name="check" /> {t("form.save")}
          </button>
        </div>
      </header>

      <div className="entry-sheet">
        <p className="entry-lead">{existing ? t("form.editHint") : t("form.addHint")}</p>
        {!admin ? <div className="callout warning">{t("form.adminOnly")} <Link to={withLocale(locale, "/admin")}>{t("header.signIn")}</Link></div> : null}
        {missing ? (
          <div className="empty-state">
            <span className="empty-icon"><Icon name="search" /></span>
            <h2>{t("form.notFound")}</h2>
            <Link className="btn btn-primary" to={withLocale(locale, "/")}>{t("results.browse")}</Link>
          </div>
        ) : !admin ? null : (
          <>
            <div className="form-grid">
              <label className="field"><span>{t("form.name")}</span><input value={draft.name} maxLength={120} onChange={(event) => setField("name", event.target.value)} /></label>
              <label className="field"><span>{t("form.category")}</span>
                <select value={draft.category} onChange={(event) => setField("category", event.target.value as Category)}>
                  {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="field"><span>{t("form.publication")}</span>
                <select value={draft.publicationStatus} onChange={(event) => setField("publicationStatus", event.target.value as Provider["publicationStatus"])}>
                  {PUBLICATION_STATUSES.map((item) => <option key={item} value={item}>{t(`filters.${item === "publish" ? "newOffers" : item === "review_hold" ? "reviewHold" : "legacy"}`)}</option>)}
                </select>
              </label>
              <label className="field"><span>{t("form.website")}</span><input value={draft.website} onChange={(event) => setField("website", event.target.value)} placeholder="https://…" /></label>
              <label className="field"><span>{t("form.service")}</span><input value={draft.service} onChange={(event) => setField("service", event.target.value)} /></label>
              <label className="field full-width"><span>{t("form.limitations")}</span><textarea value={draft.limitations} onChange={(event) => setField("limitations", event.target.value)} /></label>
            </div>

            <div className="form-divider"><h3>{t("form.countries")}</h3><p>{t("form.countriesHint")}</p></div>
            <div className="country-bulk">
              <button className="link-btn" type="button" onClick={() => COUNTRIES.forEach((item) => { if (!draft.countries[item]) setCountry(item, "Check"); })}>{t("form.addAll")}</button>
              <button className="link-btn" type="button" onClick={() => COUNTRIES.forEach((item) => setCountry(item, ""))}>{t("form.clearAll")}</button>
            </div>
            {COUNTRIES.map((item) => {
              const entry = draft.countries[item];
              return (
                <div className="country-editor" key={item}>
                  <div className="country-editor-row">
                    <label className="country-name-inline"><span className="country-code">{CODES[item]}</span>{item}</label>
                    <select value={entry?.status || ""} onChange={(event) => setCountry(item, event.target.value as Status | "")}>
                      <option value="">{t("form.notIn")}</option>
                      {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                  {entry ? (
                    <div className="country-editor-details">
                      <label className="field"><span>{t("form.countryNote")}</span><textarea value={entry.note} onChange={(event) => setDraft((current) => ({ ...current, countries: { ...current.countries, [item]: { ...entry, note: event.target.value } } }))} /></label>
                      <label className="field"><span>{t("form.localAge")}</span><input value={entry.age || ""} onChange={(event) => setDraft((current) => ({ ...current, countries: { ...current.countries, [item]: { ...entry, age: event.target.value } } }))} /></label>
                      <label className="field full-width"><span>{t("form.localUrl")}</span><input value={entry.url || ""} onChange={(event) => setDraft((current) => ({ ...current, countries: { ...current.countries, [item]: { ...entry, url: event.target.value } } }))} /></label>
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div className="form-divider"><h3>{t("form.ages")}</h3><p>{t("form.agesHint")}</p></div>
            <div className="form-grid">
              <label className="field"><span>{t("form.age")}</span><input value={draft.ageEligibility} onChange={(event) => setField("ageEligibility", event.target.value)} /></label>
              <label className="field"><span>{t("form.evidence")}</span>
                <select value={draft.ageEvidence} onChange={(event) => setField("ageEvidence", event.target.value as Provider["ageEvidence"])}>{AGE_EVIDENCE.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              </label>
              <label className="field"><span>{t("form.upperStatus")}</span>
                <select value={draft.upperAgeStatus} onChange={(event) => setField("upperAgeStatus", event.target.value as Provider["upperAgeStatus"])}>{UPPER_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              </label>
              <label className="field"><span>{t("form.upperRule")}</span><input value={draft.upperAge} onChange={(event) => setField("upperAge", event.target.value)} /></label>
              <label className="field full-width"><span>{t("form.ageNotes")}</span><textarea value={draft.ageNotes} onChange={(event) => setField("ageNotes", event.target.value)} /></label>
            </div>

            {draft.category === "Ramps" ? (
              <div className="form-grid">
                <label className="field"><span>{t("form.ramps")}</span><textarea value={draft.minPayment || ""} onChange={(event) => setField("minPayment", event.target.value)} /></label>
                <label className="field"><span>{t("detail.maxPay")}</span><textarea value={draft.maxPayment || ""} onChange={(event) => setField("maxPayment", event.target.value)} /></label>
              </div>
            ) : null}

            {draft.category === "Loans & credit" ? (
              <>
                <div className="form-divider"><h3>{t("form.lending")}</h3><p>{t("form.lendingHint")}</p></div>
                <div className="form-grid">
                  <label className="field"><span>{t("form.lender")}</span><input value={lending.lender} onChange={(event) => setField("lending", { ...lending, lender: event.target.value })} /></label>
                  <label className="field"><span>{t("form.type")}</span>
                    <select value={lending.type} onChange={(event) => setField("lending", { ...lending, type: event.target.value as Lending["type"] })}>{LOAN_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                  </label>
                  <label className="field"><span>{t("form.security")}</span>
                    <select value={lending.security} onChange={(event) => setField("lending", { ...lending, security: event.target.value as Lending["security"] })}>{LOAN_SECURITY.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                  </label>
                  <label className="field"><span>{t("form.minimum")}</span><textarea value={lending.minimum} onChange={(event) => setField("lending", { ...lending, minimum: event.target.value })} /></label>
                  <label className="field"><span>{t("form.basis")}</span><input value={lending.minimumBasis} onChange={(event) => setField("lending", { ...lending, minimumBasis: event.target.value })} /></label>
                  <label className="field"><span>{t("form.currency")}</span><input value={lending.currency} onChange={(event) => setField("lending", { ...lending, currency: event.target.value })} /></label>
                  <label className="field full-width">
                    <span className="checkbox-label"><input type="checkbox" checked={lending.smallCredit} onChange={(event) => setField("lending", { ...lending, smallCredit: event.target.checked })} />{t("form.small")}</span>
                  </label>
                  <label className="field full-width"><span>{t("form.costs")}</span><textarea value={lending.costs} onChange={(event) => setField("lending", { ...lending, costs: event.target.value })} /></label>
                </div>
              </>
            ) : null}

            {draft.category === "Mining Solutions" ? (
              <>
                <div className="form-divider"><h3>{t("form.mining")}</h3><p>{t("form.miningHint")}</p></div>
                <div className="form-grid">
                  <label className="field"><span>{t("mining.type")}</span><input value={mining.productType} onChange={(event) => setField("mining", { ...mining, productType: event.target.value })} /></label>
                  <label className="field"><span>{t("mining.rewards")}</span><input value={mining.rewards} onChange={(event) => setField("mining", { ...mining, rewards: event.target.value })} /></label>
                  <label className="field"><span>{t("filters.miningSpeed")}</span>
                    <select value={mining.withdrawalSpeed} onChange={(event) => setField("mining", { ...mining, withdrawalSpeed: event.target.value as Mining["withdrawalSpeed"] })}>
                      {WITHDRAWAL_SPEEDS.map((item) => <option key={item} value={item}>{t(`mining.speedLabel.${item}`)}</option>)}
                    </select>
                  </label>
                  <label className="field"><span>{t("filters.miningRating")}</span>
                    <select value={mining.withdrawalRating} onChange={(event) => setField("mining", { ...mining, withdrawalRating: event.target.value as Mining["withdrawalRating"] })}>
                      {WITHDRAWAL_RATINGS.map((item) => <option key={item} value={item}>{item.replace("_", " / ")}</option>)}
                    </select>
                  </label>
                  <label className="field full-width"><span>{t("mining.payout")}</span><textarea value={mining.payoutMethod} onChange={(event) => setField("mining", { ...mining, payoutMethod: event.target.value })} /></label>
                  <label className="field full-width"><span>{t("mining.rules")}</span><textarea value={mining.withdrawalRules} onChange={(event) => setField("mining", { ...mining, withdrawalRules: event.target.value })} /></label>
                  <label className="field full-width">
                    <span className="checkbox-label"><input type="checkbox" checked={mining.externalWallet} onChange={(event) => setField("mining", { ...mining, externalWallet: event.target.checked })} />{t("mining.external")}</span>
                  </label>
                </div>
              </>
            ) : null}

            <div className="form-divider"><h3>{t("form.sources")}</h3><p>{t("form.sourcesHint")}</p></div>
            <div className="form-grid">
              <label className="field"><span>{t("form.ageSources")}</span><textarea value={draft.sources.age.join("\n")} onChange={(event) => setDraft((current) => ({ ...current, sources: { ...current.sources, age: event.target.value.split("\n") } }))} /></label>
              <label className="field"><span>{t("form.serviceSources")}</span><textarea value={draft.sources.service.join("\n")} onChange={(event) => setDraft((current) => ({ ...current, sources: { ...current.sources, service: event.target.value.split("\n") } }))} /></label>
              <label className="field full-width"><span>{t("form.notes")}</span><textarea value={draft.notes} onChange={(event) => setField("notes", event.target.value)} /></label>
            </div>
            {error ? <div className="form-error" role="alert">{error}</div> : null}

            <footer className="entry-footer">
              <label className="checkbox-label"><input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} />{t("form.favorite")}</label>
              <div className="footer-actions">
                <Link className="btn" to={withLocale(locale, "/")}>{t("form.cancel")}</Link>
                <button className="btn btn-primary" type="button" disabled={!admin || busy} onClick={submit}>
                  <Icon name="check" /> {t("form.save")}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
