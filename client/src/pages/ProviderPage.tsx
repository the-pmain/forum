import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { COUNTRY_SLUGS, FAVORITES_KEY, SLUG_TO_COUNTRY } from "@shared/constants.ts";
import { categoryInfo, providerURL } from "@shared/filter.ts";
import type { Workspace } from "@shared/types.ts";
import { CommentSection } from "../components/CommentSection.tsx";
import { AdminEntryControls } from "../components/AdminEntryControls.tsx";
import { ProviderRecord } from "../components/ProviderRecord.tsx";
import { useI18n, withLocale } from "../i18n/context.tsx";
import { Icon } from "../lib/icons.tsx";
import { displayDate, initials } from "../lib/utils.ts";

function readFavorites(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function ProviderPage({
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
  const [searchParams] = useSearchParams();
  const slug = String(id || "").trim();
  const countryQuery = searchParams.get("country")?.toLowerCase() || "";
  const countrySlug = countryQuery in SLUG_TO_COUNTRY ? countryQuery : undefined;
  const provider = [...workspace.providers, ...workspace.trash].find((item) => item.id === slug);
  const visible = Boolean(provider && (admin || provider.hidden !== true));
  const [tab, setTab] = useState<"overview" | "age" | "sources">("overview");
  const [favorites, setFavorites] = useState(readFavorites);
  const saved = Boolean(provider && favorites.includes(provider.id));

  function toggleFavorite() {
    if (!provider) return;
    const next = saved ? favorites.filter((item) => item !== provider.id) : [...favorites, provider.id];
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }

  if (!provider || !visible) {
    return (
      <main className="entry-page">
        <header className="entry-topbar">
          <Link className="btn" to={withLocale(locale, "/")}><Icon name="left" /> {t("form.back")}</Link>
        </header>
        <div className="entry-sheet">
          <div className="empty-state">
            <span className="empty-icon"><Icon name="search" /></span>
            <h2>{t("form.notFound")}</h2>
            <Link className="btn btn-primary" to={withLocale(locale, "/")}>{t("results.browse")}</Link>
          </div>
        </div>
      </main>
    );
  }

  const site = providerURL(provider, "all");

  return (
    <main className="entry-page provider-page">
      <header className="entry-topbar">
        <Link className="btn" to={withLocale(locale, "/")}>
          <Icon name="left" /> {t("form.back")}
        </Link>
        <div className="entry-topbar-title">
          <div className="eyebrow">{t("detail.record")}</div>
          <h1>{provider.name}</h1>
        </div>
        <div className="entry-topbar-actions">
          {site ? (
            <a className="btn btn-primary" href={site} target="_blank" rel="noopener noreferrer">
              {t("detail.website")} <Icon name="external" />
            </a>
          ) : null}
          <AdminEntryControls
            admin={admin}
            provider={provider}
            onWorkspace={(next) => { setWorkspace(next); }}
          />
          <button className={`btn${saved ? " is-favorite" : ""}`} type="button" onClick={toggleFavorite}>
            <Icon name="star" />{saved ? t("detail.saved") : t("detail.save")}
          </button>
        </div>
      </header>

      <div className="provider-page-head">
        <div className={`drawer-provider${provider.verified ? " is-verified" : ""}${provider.hidden ? " is-hidden" : ""}`} data-category={provider.category}>
          <div className="avatar">{initials(provider.name)}</div>
          <div>
            <h2>{provider.name}</h2>
            <span className="category-tag">{provider.lending?.type || provider.mining?.productType || provider.p2p?.productType || categoryInfo(provider.category).label}</span>
            {provider.verified ? <span className="verified-mark"><Icon name="badgeCheck" /> {t("admin.verifiedMark")}</span> : null}
            {admin && provider.hidden ? <span className="hidden-mark"><Icon name="eyeOff" /> {t("admin.hiddenMark")}</span> : null}
          </div>
        </div>
        <div className="drawer-tabs" role="tablist">
          {(["overview", "age", "sources"] as const).map((item) => (
            <button key={item} type="button" role="tab" className={tab === item ? "active" : ""} aria-selected={tab === item} onClick={() => setTab(item)}>
              {t(`detail.${item}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="entry-sheet provider-page-body">
        <ProviderRecord provider={provider} tab={tab} />
        <CommentSection
          slug={provider.id}
          admin={admin}
          countrySlug={countrySlug || (provider.countryFocus && COUNTRY_SLUGS[provider.countryFocus as keyof typeof COUNTRY_SLUGS])}
        />
        <footer className="drawer-footer">
          {provider.updatedAt ? t("detail.footerEdited", { date: displayDate(provider.updatedAt) }) : t("detail.footerImport")} · {t("detail.footerFresh")}
        </footer>
      </div>
    </main>
  );
}
