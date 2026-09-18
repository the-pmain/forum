import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  CATEGORY_INFO,
  CODES,
  COUNTRIES,
  COUNTRY_SLUGS,
  FAVORITES_KEY,
  LOAN_SECURITY,
  LOAN_SPEED,
  LOAN_TYPES,
  SLUG_TO_COUNTRY,
  UPPER_STATUSES,
  VIEW_KEY,
} from "@shared/constants.ts";
import { categoryInfo, filterRecords, paginate } from "@shared/filter.ts";
import type { DirectoryView, Workspace } from "@shared/types.ts";
import { DEFAULT_VIEW } from "@shared/types.ts";
import { MarketChips, StatusBadge } from "../components/ui.tsx";
import { useI18n, withLocale } from "../i18n/context.tsx";
import { api, downloadDocument } from "../lib/api.ts";
import { Icon } from "../lib/icons.tsx";
import { downloadJson, exportCsv, initials, loanAmountLabel } from "../lib/utils.ts";

interface Toast {
  id: number;
  message: string;
}

interface ConfirmState {
  title: string;
  message: string;
  label: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
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

function readView(): DirectoryView {
  if (typeof localStorage === "undefined") return DEFAULT_VIEW;
  try {
    return { ...DEFAULT_VIEW, ...JSON.parse(localStorage.getItem(VIEW_KEY) || "null") };
  } catch {
    return DEFAULT_VIEW;
  }
}

export function DirectoryPage({
  workspace,
  setWorkspace,
  admin,
}: {
  workspace: Workspace;
  setWorkspace: (workspace: Workspace) => void;
  admin: boolean;
}) {
  const { t, locale } = useI18n();
  const routerNavigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<DirectoryView>(DEFAULT_VIEW);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFavorites(readFavorites());
    const stored = readView();
    const countrySlug = searchParams.get("country")?.toLowerCase() || "";
    const fromUrl = countrySlug in SLUG_TO_COUNTRY ? SLUG_TO_COUNTRY[countrySlug as keyof typeof SLUG_TO_COUNTRY] : undefined;
    setView(fromUrl ? { ...stored, country: fromUrl, mode: "directory" } : stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      localStorage.setItem(VIEW_KEY, JSON.stringify(view));
    } catch {
      /* ignore */
    }
  }, [favorites, view, hydrated]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement)?.tagName);
      if (!typing && ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" || event.key === "/")) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (event.key === "Escape") {
        setToolsOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toast = (message: string) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message }]);
    setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 6500);
  };

  const ask = (title: string, message: string, label: string, danger = true) =>
    new Promise<boolean>((resolve) => setConfirm({ title, message, label, danger, resolve }));

  const navigateView = (patch: Partial<DirectoryView>, scroll = false) => {
    setView((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
    setSidebarOpen(false);
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goCountry = (country: DirectoryView["country"]) => {
    const next = new URLSearchParams(searchParams);
    if (country === "all") next.delete("country");
    else next.set("country", COUNTRY_SLUGS[country]);
    setSearchParams(next, { replace: true });
    navigateView({ country, mode: "directory" }, true);
  };

  const records = view.mode === "trash" ? workspace.trash : workspace.providers;
  const filtered = useMemo(() => filterRecords(records, view, favorites), [records, view, favorites]);
  const categoryCounts = useMemo(() => filterRecords(records, view, favorites, true), [records, view, favorites]);
  const paging = paginate(filtered, view.page);
  const showLoans = view.category === "Loans & credit";
  const showBanks = view.category === "High-street banks" && view.mode !== "trash";
  const requireAdmin = async () => {
    if (admin) return true;
    toast(t("toasts.needAdmin"));
    return false;
  };

  function goToEntry(id?: string) {
    const search = id ? "" : `?category=${encodeURIComponent(view.category)}&country=${encodeURIComponent(view.country)}`;
    routerNavigate(`${withLocale(locale, id ? `/entry/${id}` : "/entry")}${search}`);
  }

  function providerHref(id: string) {
    const path = withLocale(locale, `/p/${id}`);
    return view.country === "all" ? path : `${path}?country=${COUNTRY_SLUGS[view.country]}`;
  }

  return (
    <div className="app-shell">
      <a className="sr-only" href="#searchInput">{t("filters.search")}</a>
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`} aria-label="Directory navigation">
        <div className="brand">
          <div className="brand-mark"><Icon name="compass" /></div>
          <div>
            <div className="brand-name">{t("brand.name")}</div>
            <div className="brand-sub">{t("brand.sub")}</div>
          </div>
        </div>
        <div className="sidebar-scroll">
          <div className="nav-caption">{t("nav.browse")}</div>
          <button className={`nav-button${view.mode === "directory" && view.category === "all" ? " active" : ""}`} type="button" onClick={() => navigateView({ mode: "directory", country: "all", category: "all", query: "", status: "all", upper: "all" }, true)}>
            <Icon name="grid" />{t("nav.all")}<span className="nav-count">{workspace.providers.length}</span>
          </button>
          <button className={`nav-button${view.mode === "favorites" ? " active" : ""}`} type="button" onClick={() => navigateView({ mode: "favorites", country: "all", category: "all", query: "", status: "all", upper: "all" }, true)}>
            <Icon name="star" />{t("nav.saved")}<span className="nav-count">{workspace.providers.filter((item) => favorites.includes(item.id)).length}</span>
          </button>
          <button className={`nav-button${view.mode === "directory" && showLoans ? " active" : ""}`} type="button" onClick={() => navigateView({ mode: "directory", category: "Loans & credit", query: "", status: "all", upper: "all", loanType: "all", loanSecurity: "all", loanSpeed: "all", loanMinimum: "all" }, true)}>
            <Icon name="wallet" />{t("nav.loans")}<span className="nav-count">{workspace.providers.filter((item) => item.category === "Loans & credit").length}</span>
          </button>
          <button className={`nav-button${view.mode === "directory" && view.category === "High-street banks" ? " active" : ""}`} type="button" onClick={() => navigateView({ mode: "directory", category: "High-street banks", query: "", status: "all", upper: "all" }, true)}>
            <Icon name="bank" />{t("nav.banks")}<span className="nav-count">{workspace.providers.filter((item) => item.category === "High-street banks").length}</span>
          </button>
          <div className="nav-caption">{t("nav.countries")}</div>
          <button className={`nav-button country-nav${view.country === "all" ? " active" : ""}`} type="button" onClick={() => goCountry("all")}>
            <Icon name="globe" />{t("nav.allCountries")}
          </button>
          {COUNTRIES.slice(0, 2).map((country) => (
            <button key={country} className={`nav-button country-nav${view.country === country ? " active" : ""}`} type="button" data-slug={COUNTRY_SLUGS[country]} onClick={() => goCountry(country)}>
              <span className="country-code">{CODES[country]}</span>{country}
            </button>
          ))}
          <div className="nav-caption">{t("nav.nordics")}</div>
          {COUNTRIES.slice(2).map((country) => (
            <button key={country} className={`nav-button country-nav${view.country === country ? " active" : ""}`} type="button" data-slug={COUNTRY_SLUGS[country]} onClick={() => goCountry(country)}>
              <span className="country-code">{CODES[country]}</span>{country}
            </button>
          ))}
          <div className="sidebar-divider" />
          <div className="nav-caption">{t("nav.workspace")}</div>
          <button className="nav-button" type="button" onClick={() => importRef.current?.click()}>
            <Icon name="database" />{t("nav.backup")}
          </button>
          <button className={`nav-button${view.mode === "trash" ? " active" : ""}`} type="button" onClick={() => navigateView({ mode: "trash", country: "all", category: "all", query: "", status: "all", upper: "all" }, true)}>
            <Icon name="trash" />{t("nav.trash")}<span className="nav-count">{workspace.trash.length}</span>
          </button>
        </div>
        <div className="sidebar-foot">
          <div className="local-info"><span className="local-dot" />{t("nav.local")}</div>
          {t("nav.localNote")}<br />
          <Link className="link-btn" to={withLocale(locale, "/help")}>{t("nav.help")} <span aria-hidden="true">↗</span></Link>
        </div>
      </aside>
      <div className={`sidebar-backdrop${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs">
            <button className="icon-btn mobile-menu" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Icon name="menu" /></button>
            <span className="crumb-root">{t("header.workspace")}</span>
            <span aria-hidden="true" className="crumb-root">/</span>
            <strong>
              {view.mode === "trash" ? t("intro.crumbTrash") : view.mode === "favorites" ? t("intro.crumbSaved") : showLoans ? (view.country === "all" ? t("intro.crumbBorrow") : t("intro.crumbBorrowCountry", { country: view.country })) : view.country === "all" ? t("intro.crumb") : t("intro.crumbCountry", { country: view.country })}
            </strong>
          </div>
          <div className="top-actions">
            <span className="saved-indicator"><Icon name="check" />{admin ? t("header.signedIn") : t("header.ready")}</span>
            <div className="menu-wrap">
              <button className="btn" type="button" aria-expanded={toolsOpen} onClick={() => setToolsOpen((open) => !open)}>
                <Icon name="download" /><span className="toolbar-label">{t("header.tools")}</span><Icon name="chevronDown" />
              </button>
              {toolsOpen ? (
                <div className="tool-menu">
                  <button type="button" onClick={async () => { setToolsOpen(false); if (!admin) return toast(t("toasts.needAdmin")); downloadJson(await api.exportWorkspace(), `financial-navigator-backup.json`); toast(t("toasts.backup")); }}>
                    <Icon name="download" /><span>{t("header.exportJson")}<small>{t("header.exportJsonHint")}</small></span>
                  </button>
                  <button type="button" onClick={() => { setToolsOpen(false); if (!admin) return toast(t("toasts.needAdmin")); importRef.current?.click(); }}>
                    <Icon name="upload" /><span>{t("header.import")}<small>{t("header.importHint")}</small></span>
                  </button>
                  <button type="button" onClick={() => { setToolsOpen(false); exportCsv(filtered, view); toast(t("toasts.csv", { count: filtered.length })); }}>
                    <Icon name="table" /><span>{t("header.exportCsv")}<small>{t("header.exportCsvHint")}</small></span>
                  </button>
                  <button type="button" onClick={async () => { setToolsOpen(false); await downloadDocument("pdf", view, favorites, document.querySelector("h1")?.textContent || "Directory"); toast(t("toasts.pdf")); }}>
                    <Icon name="file" /><span>{t("header.exportPdf")}<small>{t("header.exportPdfHint")}</small></span>
                  </button>
                  <button type="button" onClick={async () => { setToolsOpen(false); await downloadDocument("docx", view, favorites, document.querySelector("h1")?.textContent || "Directory"); toast(t("toasts.docx")); }}>
                    <Icon name="share" /><span>{t("header.exportDocx")}<small>{t("header.exportDocxHint")}</small></span>
                  </button>
                  <hr />
                  <Link to={withLocale(locale, "/help")} onClick={() => setToolsOpen(false)}><Icon name="info" /><span>{t("header.saveSite")}</span></Link>
                </div>
              ) : null}
            </div>
            <select className="filter-select locale-select" aria-label="Language" value={locale} onChange={(event) => { window.location.href = withLocale(event.target.value as typeof locale, "/"); }}>
              <option value="en">EN</option>
              <option value="nl">NL</option>
              <option value="de">DE</option>
            </select>
            <Link className="btn" to={withLocale(locale, "/admin")}>{t("nav.admin")}</Link>
            <button className="btn btn-primary" type="button" disabled onClick={() => goToEntry()}><Icon name="plus" />{t("header.add")}</button>
          </div>
        </header>

        <div className="content">
          <section className="intro" aria-labelledby="pageTitle">
            <div>
              <div className="eyebrow">{view.country === "all" ? t("intro.eyebrowAll") : view.country}</div>
              <h1 id="pageTitle">
                {view.mode === "trash" ? t("intro.titleTrash") : view.mode === "favorites" ? t("intro.titleSaved") : showLoans ? (view.country === "all" ? t("intro.titleLoans") : t("intro.titleLoansCountry", { country: view.country })) : view.country !== "all" ? t("intro.titleCountry", { country: view.country }) : t("intro.title")}
              </h1>
              <p>
                {view.mode === "trash" ? t("intro.descriptionTrash") : view.mode === "favorites" ? t("intro.descriptionSaved") : showLoans ? t("intro.descriptionLoans") : view.country !== "all" ? t("intro.descriptionCountry") : t("intro.description")}
              </p>
            </div>
            <div className="stats-inline">
              <div><strong className="count">{workspace.providers.length}</strong><span>{t("intro.entries")}</span></div>
              <div><strong className="count">6</strong><span>{t("intro.countries")}</span></div>
              <div><strong className="count">{CATEGORY_INFO.length}</strong><span>{t("intro.categories")}</span></div>
            </div>
          </section>

          <div className="mobile-country-row">
            <label className="sr-only" htmlFor="mobileCountry">Country profile</label>
            <select id="mobileCountry" value={view.country} onChange={(event) => navigateView({ country: event.target.value as DirectoryView["country"], mode: "directory" })}>
              <option value="all">{t("nav.allCountries")}</option>
              {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          </div>

          <nav className="category-grid" aria-label="Service categories">
            {CATEGORY_INFO.map((category) => (
              <button key={category.name} className={`category-tile${view.category === category.name ? " active" : ""}`} type="button" data-category={category.name} aria-pressed={view.category === category.name} onClick={() => navigateView({ category: view.category === category.name ? "all" : category.name })}>
                <span className="tile-top">
                  <span className="tile-icon"><Icon name={category.icon} /></span>
                  <span className="tile-count count">{categoryCounts.filter((item) => item.category === category.name).length}</span>
                </span>
                <span className="tile-name">{category.label}</span>
                <div className="tile-note">{category.note}</div>
              </button>
            ))}
          </nav>

          {showBanks ? (
            <div className="callout bank-notice">
              <Icon name="bank" />
              <div><strong>{t("notices.bankTitle")}</strong><p>{t("notices.bankBody")}</p></div>
            </div>
          ) : null}

          {showLoans && view.mode !== "trash" ? (
            <div className="loan-notice">
              <div className="loan-notice-icon"><Icon name="shield" /></div>
              <div><strong>{t("notices.loanTitle")}</strong><p>{t("notices.loanBody")}</p></div>
              <Link className="link-btn" to={withLocale(locale, "/help")}>{t("notices.readGuide")} <span aria-hidden="true">↗</span></Link>
            </div>
          ) : null}

          {view.mode === "trash" ? (
            <div className="callout trash-banner">
              <span>{t("notices.trash")}</span>
              <button className="btn btn-sm btn-danger" type="button" disabled onClick={async () => {
                if (!(await requireAdmin())) return;
                if (await ask(t("confirm.emptyTitle"), t("confirm.empty", { count: workspace.trash.length }), t("confirm.emptyAction"))) {
                  setWorkspace((await api.emptyTrash()).workspace);
                  toast(t("toasts.emptied"));
                }
              }}>{t("notices.emptyTrash")}</button>
            </div>
          ) : null}

          <section className="filter-panel" aria-label="Search and filter providers">
            <div className="search-row">
              <div className="search-box">
                <Icon name="search" />
                <input id="searchInput" ref={searchRef} type="search" autoComplete="off" placeholder={t("filters.search")} value={view.query} onChange={(event) => navigateView({ query: event.target.value.slice(0, 500) })} />
                <kbd className="key">Ctrl K</kbd>
              </div>
            </div>
            <div className="filters-row">
              <label className="filter-label">
                <span>{t("filters.status")}</span>
                <select className="filter-select" value={view.status} onChange={(event) => navigateView({ status: event.target.value as DirectoryView["status"] })}>
                  <option value="all">{t("filters.allFlags")}</option>
                  <option value="Listed">{t("filters.listed")}</option>
                  <option value="Check">{t("filters.check")}</option>
                  <option value="Limited">{t("filters.limited")}</option>
                  <option value="Restricted">{t("filters.restricted")}</option>
                </select>
              </label>
              <label className="filter-label">
                <span>{t("filters.upper")}</span>
                <select className="filter-select" value={view.upper} onChange={(event) => navigateView({ upper: event.target.value as DirectoryView["upper"] })}>
                  <option value="all">{t("filters.allUpper")}</option>
                  {UPPER_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <button className="filter-reset" type="button" onClick={() => navigateView({ country: "all", category: "all", query: "", status: "all", upper: "all", loanType: "all", loanSecurity: "all", loanSpeed: "all", loanMinimum: "all" })}>
                <Icon name="reset" />{t("filters.clear")}
              </button>
            </div>
            {showLoans ? (
              <>
                <nav className="loan-shortcuts" aria-label="Borrowing shortcuts">
                  {(["all", "cards", "small", "new"] as const).map((shortcut) => (
                    <button key={shortcut} className={`btn btn-sm${(shortcut === "cards" ? view.loanType === "Credit card" && view.loanMinimum === "all" : shortcut === "small" ? view.loanMinimum === "small" : shortcut === "new" ? view.loanMinimum === "new" : view.loanType === "all" && view.loanMinimum === "all") ? " active" : ""}`} type="button" onClick={() => navigateView({ mode: "directory", category: "Loans & credit", query: "", status: "all", upper: "all", loanType: shortcut === "cards" ? "Credit card" : "all", loanSecurity: "all", loanSpeed: "all", loanMinimum: shortcut === "small" || shortcut === "new" ? shortcut : "all" }, true)}>
                      {t(shortcut === "all" ? "filters.allBorrowing" : shortcut === "cards" ? "filters.cards" : shortcut === "small" ? "filters.small" : "filters.neu")}
                    </button>
                  ))}
                  <span>{t("filters.shortcutNote")}</span>
                </nav>
                <div className="loan-filter-panel">
                  <div className="loan-filter-title">{t("filters.borrowTitle")} <span>{t("filters.borrowHint")}</span></div>
                  <div className="loan-filter-grid">
                    <label>{t("filters.productType")}
                      <select value={view.loanType} onChange={(event) => navigateView({ loanType: event.target.value as DirectoryView["loanType"] })}>
                        <option value="all">{t("filters.allTypes")}</option>
                        {LOAN_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                    <label>{t("filters.collateral")}
                      <select value={view.loanSecurity} onChange={(event) => navigateView({ loanSecurity: event.target.value as DirectoryView["loanSecurity"] })}>
                        <option value="all">{t("filters.allSecurity")}</option>
                        {LOAN_SECURITY.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                    <label>{t("filters.decision")}
                      <select value={view.loanSpeed} onChange={(event) => navigateView({ loanSpeed: event.target.value as DirectoryView["loanSpeed"] })}>
                        <option value="all">{t("filters.allSpeed")}</option>
                        {LOAN_SPEED.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                    <label>{t("filters.amount")}
                      <select value={view.loanMinimum} onChange={(event) => navigateView({ loanMinimum: event.target.value as DirectoryView["loanMinimum"] })}>
                        <option value="all">{t("filters.allAmounts")}</option>
                        <option value="published">{t("filters.published")}</option>
                        <option value="small">{t("filters.small")}</option>
                        <option value="new">{t("filters.neu")}</option>
                      </select>
                    </label>
                  </div>
                </div>
              </>
            ) : null}
          </section>

          <div className="active-chips">
            {view.country !== "all" ? <button className="filter-chip" type="button" onClick={() => navigateView({ country: "all" })}>{view.country}<Icon name="x" /></button> : null}
            {view.category !== "all" ? <button className="filter-chip" type="button" onClick={() => navigateView({ category: "all" })}>{view.category}<Icon name="x" /></button> : null}
            {view.status !== "all" ? <button className="filter-chip" type="button" onClick={() => navigateView({ status: "all" })}>{view.status}<Icon name="x" /></button> : null}
            {view.upper !== "all" ? <button className="filter-chip" type="button" onClick={() => navigateView({ upper: "all" })}>{t("filters.upperChip", { value: view.upper })}<Icon name="x" /></button> : null}
            {view.query ? <button className="filter-chip" type="button" onClick={() => navigateView({ query: "" })}>{t("filters.searchChip", { query: view.query })}<Icon name="x" /></button> : null}
          </div>

          <section aria-labelledby="resultsTitle">
            <div className="result-head">
              <div className="results-left">
                <h2 id="resultsTitle">{view.mode === "trash" ? t("results.deleted") : view.category === "all" ? (view.mode === "favorites" ? t("results.saved") : t("results.allEntries")) : categoryInfo(view.category).label}</h2>
                <span className="small muted" role="status">{filtered.length} {filtered.length === 1 ? t("results.record") : t("results.records")}</span>
              </div>
              <div className="result-controls">
                <select className="sort-select" value={view.sort} onChange={(event) => navigateView({ sort: event.target.value as DirectoryView["sort"] })}>
                  <option value="az">{t("filters.sortAz")}</option>
                  <option value="za">{t("filters.sortZa")}</option>
                  <option value="updated">{t("filters.sortUpdated")}</option>
                </select>
                <div className="view-switch" role="group" aria-label="Display style">
                  <button type="button" className={view.layout === "grid" ? "active" : ""} aria-pressed={view.layout === "grid"} title={t("filters.cardView")} onClick={() => navigateView({ layout: "grid" })}><Icon name="grid" /></button>
                  <button type="button" className={view.layout === "list" ? "active" : ""} aria-pressed={view.layout === "list"} title={t("filters.tableView")} onClick={() => navigateView({ layout: "list" })}><Icon name="list" /></button>
                </div>
              </div>
            </div>

            {!filtered.length ? (
              <div className="empty-state">
                <span className="empty-icon"><Icon name={view.mode === "favorites" ? "star" : view.mode === "trash" ? "trash" : "search"} /></span>
                <h2>{view.mode === "trash" ? t("results.emptyTrash") : view.mode === "favorites" ? t("results.emptySaved") : t("results.empty")}</h2>
                <p>{view.mode === "favorites" ? t("results.emptySavedHint") : view.mode === "trash" ? t("results.emptyTrashHint") : t("results.emptyHint")}</p>
                <button className="btn" type="button" onClick={() => navigateView({ country: "all", category: "all", query: "", status: "all", upper: "all", loanType: "all", loanSecurity: "all", loanSpeed: "all", loanMinimum: "all" })}>{t("filters.clear")}</button>
                <button className="btn btn-primary" type="button" disabled={view.mode === "directory"} onClick={() => view.mode === "directory" ? goToEntry() : navigateView({ mode: "directory" })}>{view.mode === "directory" ? t("results.add") : t("results.browse")}</button>
              </div>
            ) : view.layout === "grid" ? (
              <div className="provider-grid">
                {paging.visible.map((provider) => (
                  <article key={provider.id} className="provider-card" data-category={provider.category}>
                    <Link className="card-hit" to={providerHref(provider.id)} aria-label={provider.name} />
                    <div className="card-inner">
                      <div className="card-header">
                        <div className="avatar" aria-hidden="true">{initials(provider.name)}</div>
                        <div className="card-title">
                          <span className="provider-name">{provider.name}</span>
                          <div className="category-tag">{provider.lending?.type || categoryInfo(provider.category).label}</div>
                        </div>
                        {view.mode !== "trash" ? (
                          <button className={`icon-btn${favorites.includes(provider.id) ? " is-favorite" : ""}`} type="button" aria-pressed={favorites.includes(provider.id)} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setFavorites((list) => list.includes(provider.id) ? list.filter((id) => id !== provider.id) : [...list, provider.id]); }}>
                            <Icon name="star" />
                          </button>
                        ) : null}
                      </div>
                      <p className="provider-description line-clamp">{provider.service || provider.limitations || provider.countryFocus || t("detail.noDescription")}</p>
                      <div className="card-meta">
                        <StatusBadge provider={provider} country={view.country} />
                        <MarketChips provider={provider} country={view.country} />
                      </div>
                      {provider.category === "Loans & credit" && provider.lending ? (
                        <div className="loan-card-meta">
                          <div className="loan-amount"><span>{t(loanAmountLabel(provider.lending.type))}</span><strong>{provider.lending.minimum || "Not verified"}</strong></div>
                          <div className="loan-meta-line"><Icon name={provider.lending.security === "Unsecured" ? "shield" : "bank"} /><span>{provider.lending.security}</span></div>
                          <div className="loan-meta-line"><Icon name="clock" /><span>{provider.lending.speed}</span></div>
                        </div>
                      ) : null}
                      <div className="card-age"><Icon name="shield" />{t("results.upperAge")} <strong>{provider.upperAgeStatus}</strong></div>
                    </div>
                    <div className="card-actions">
                      {view.mode === "trash" ? (
                        <>
                          <button className="link-btn" type="button" disabled onClick={async () => { if (await requireAdmin()) { setWorkspace((await api.restoreProvider(provider.id)).workspace); toast(t("toasts.restored", { name: provider.name })); } }}><Icon name="reset" /> {t("results.restore")}</button>
                          <button className="icon-btn danger" type="button" disabled onClick={async () => { if (await requireAdmin() && await ask(t("confirm.deleteTitle"), t("confirm.delete", { name: provider.name }), t("confirm.deleteAction"))) { setWorkspace((await api.permanentDelete(provider.id)).workspace); toast(t("toasts.deleted", { name: provider.name })); } }}><Icon name="trash" /></button>
                        </>
                      ) : (
                        <>
                          <Link className="link-btn" to={providerHref(provider.id)}>{t("results.viewDetails")} <Icon name="right" /></Link>
                          <div className="card-action-icons">
                            <button className="icon-btn" type="button" disabled onClick={() => goToEntry(provider.id)}><Icon name="edit" /></button>
                            <button className="icon-btn danger" type="button" disabled onClick={async () => { if (await requireAdmin() && await ask(t("confirm.trashTitle"), t("confirm.trash", { name: provider.name }), t("confirm.trashAction"))) { setWorkspace((await api.trashProvider(provider.id)).workspace); toast(t("toasts.trashed", { name: provider.name })); } }}><Icon name="trash" /></button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="table-wrap">
                <table className={`provider-table${showLoans ? " loan-table" : ""}`}>
                  <thead>
                    <tr>
                      {showLoans ? (
                        <><th>{t("table.product")}</th><th>{t("table.type")}</th><th>{t("table.amount")}</th><th>{t("table.funding")}</th><th>{t("table.upper")}</th><th>{t("table.actions")}</th></>
                      ) : (
                        <><th>{t("table.provider")}</th><th>{t("table.category")}</th><th>{t("table.flag")}</th><th>{t("table.records")}</th><th>{t("table.upper")}</th><th>{t("table.actions")}</th></>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paging.visible.map((provider) => (
                      <tr key={provider.id} data-category={provider.category} className="table-row-link" onClick={(event) => { if (!(event.target as HTMLElement).closest("button, a")) routerNavigate(providerHref(provider.id)); }}>
                        <td>
                          <div className="table-provider">
                            {!showLoans ? <div className="avatar" aria-hidden="true">{initials(provider.name)}</div> : null}
                            <Link className="provider-name" to={providerHref(provider.id)}>{provider.name}</Link>
                          </div>
                          {showLoans ? <div className="market-chips" style={{ marginTop: 7 }}><MarketChips provider={provider} country={view.country} /></div> : null}
                        </td>
                        {showLoans ? (
                          <>
                            <td><span className="small">{provider.lending?.type}</span><div className="tiny muted" style={{ marginTop: 5 }}>{provider.lending?.security}</div></td>
                            <td><strong className="small">{provider.lending?.minimum || "Not verified"}</strong><div className="tiny muted" style={{ marginTop: 5 }}>{provider.lending?.minimumBasis}</div></td>
                            <td><span className="small">{provider.lending?.speed}</span><div className="tiny muted" style={{ marginTop: 5 }}>{provider.lending?.decision}</div></td>
                            <td className="small">{provider.upperAgeStatus}<div className="tiny muted" style={{ marginTop: 5 }}>{provider.ageEligibility}</div></td>
                          </>
                        ) : (
                          <>
                            <td className="small muted">{categoryInfo(provider.category).label}</td>
                            <td><StatusBadge provider={provider} country={view.country} /></td>
                            <td className="table-country"><MarketChips provider={provider} country={view.country} /></td>
                            <td className="small muted">{provider.upperAgeStatus}</td>
                          </>
                        )}
                        <td className="table-actions">
                          {view.mode === "trash" ? (
                            <>
                              <button className="icon-btn" type="button" disabled onClick={async () => { if (await requireAdmin()) { setWorkspace((await api.restoreProvider(provider.id)).workspace); toast(t("toasts.restored", { name: provider.name })); } }}><Icon name="reset" /></button>
                              <button className="icon-btn danger" type="button" disabled onClick={async () => { if (await requireAdmin() && await ask(t("confirm.deleteTitle"), t("confirm.delete", { name: provider.name }), t("confirm.deleteAction"))) { setWorkspace((await api.permanentDelete(provider.id)).workspace); toast(t("toasts.deleted", { name: provider.name })); } }}><Icon name="trash" /></button>
                            </>
                          ) : (
                            <>
                              <button className={`icon-btn${favorites.includes(provider.id) ? " is-favorite" : ""}`} type="button" onClick={() => setFavorites((list) => list.includes(provider.id) ? list.filter((id) => id !== provider.id) : [...list, provider.id])}><Icon name="star" /></button>
                              <button className="icon-btn" type="button" disabled onClick={() => goToEntry(provider.id)}><Icon name="edit" /></button>
                              <button className="icon-btn danger" type="button" disabled onClick={async () => { if (await requireAdmin() && await ask(t("confirm.trashTitle"), t("confirm.trash", { name: provider.name }), t("confirm.trashAction"))) { setWorkspace((await api.trashProvider(provider.id)).workspace); toast(t("toasts.trashed", { name: provider.name })); } }}><Icon name="trash" /></button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filtered.length ? (
              <div className="pagination">
                <span>{t("results.showing", { start: paging.start + 1, end: paging.start + paging.visible.length, total: filtered.length })}</span>
                <div className="page-buttons">
                  <button className="btn" type="button" disabled={paging.page === 1} onClick={() => navigateView({ page: paging.page - 1 })}><Icon name="left" />{t("results.previous")}</button>
                  <span className="count">{paging.page} / {paging.pages}</span>
                  <button className="btn" type="button" disabled={paging.page === paging.pages} onClick={() => navigateView({ page: paging.page + 1 })}>{t("results.next")}<Icon name="right" /></button>
                </div>
              </div>
            ) : null}
          </section>

          <footer className="scope-note">
            <Icon name="info" />
            <span>{t("results.scope")} <Link className="link-btn" to={withLocale(locale, "/help")}>{t("results.dataNotes")}</Link></span>
          </footer>
        </div>
      </main>

      {confirm ? (
        <dialog className="confirm-modal" open>
          <h2>{confirm.title}</h2>
          <p>{confirm.message}</p>
          <div className="confirm-actions">
            <button className="btn" type="button" onClick={() => { confirm.resolve(false); setConfirm(null); }}>{t("confirm.cancel")}</button>
            <button className={`btn ${confirm.danger ? "btn-danger" : "btn-primary"}`} type="button" onClick={() => { confirm.resolve(true); setConfirm(null); }}>{confirm.label}</button>
          </div>
        </dialog>
      ) : null}

      <input ref={importRef} className="hidden" type="file" accept="application/json,.json" onChange={async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || !(await requireAdmin())) return;
        try {
          const parsed = JSON.parse(await file.text());
          setWorkspace((await api.importWorkspace(parsed, "merge")).workspace);
          toast(t("toasts.merged"));
        } catch (error) {
          toast(error instanceof Error ? error.message : t("toasts.needAdmin"));
        }
      }} />

      <div className="toast-container" aria-live="polite">
        {toasts.map((item) => (
          <div className="toast" key={item.id}><Icon name="check" /><span>{item.message}</span></div>
        ))}
      </div>
    </div>
  );
}

