import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import seedJson from "../../data/seed.json";
import { DEFAULT_LOCALE, LOCALES, WORKSPACE_ID } from "@shared/constants.ts";
import type { Locale, Workspace } from "@shared/types.ts";
import { normaliseWorkspace } from "@shared/workspace.ts";
import { I18nProvider, localeFromPath } from "./i18n/context.tsx";
import { api, isAccessDenied } from "./lib/api.ts";
import { AccessDeniedPage } from "./pages/AccessDeniedPage.tsx";
import { AdminLoginPage } from "./pages/AdminLoginPage.tsx";
import { DirectoryPage } from "./pages/DirectoryPage.tsx";
import { EntryPage } from "./pages/EntryPage.tsx";
import { HelpPage } from "./pages/HelpPage.tsx";
import { ProviderPage } from "./pages/ProviderPage.tsx";

const seed = normaliseWorkspace(seedJson, WORKSPACE_ID);

function initialWorkspace(): Workspace {
  if (typeof window !== "undefined" && window.__NAVIGATOR__) {
    try {
      const injected = normaliseWorkspace(window.__NAVIGATOR__, WORKSPACE_ID);
      if (injected.providers.length) return injected;
    } catch {
      /* keep bundled seed */
    }
  }
  return seed;
}

function AppRoutes({
  workspace,
  setWorkspace,
  admin,
  setAdmin,
}: {
  workspace: Workspace;
  setWorkspace: (workspace: Workspace) => void;
  admin: boolean;
  setAdmin: (value: boolean) => void;
}) {
  return (
    <Routes>
      <Route path="/" element={<DirectoryPage workspace={workspace} setWorkspace={setWorkspace} admin={admin} />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/admin" element={<AdminLoginPage admin={admin} onAuth={setAdmin} />} />
      <Route path="/entry" element={<EntryPage workspace={workspace} setWorkspace={setWorkspace} admin={admin} />} />
      <Route path="/entry/:id" element={<EntryPage workspace={workspace} setWorkspace={setWorkspace} admin={admin} />} />
      <Route path="/p/:id" element={<ProviderPage workspace={workspace} setWorkspace={setWorkspace} admin={admin} />} />
      {LOCALES.filter((item) => item !== DEFAULT_LOCALE).flatMap((locale) => [
        <Route key={`${locale}-home`} path={`/${locale}`} element={<DirectoryPage workspace={workspace} setWorkspace={setWorkspace} admin={admin} />} />,
        <Route key={`${locale}-help`} path={`/${locale}/help`} element={<HelpPage />} />,
        <Route key={`${locale}-admin`} path={`/${locale}/admin`} element={<AdminLoginPage admin={admin} onAuth={setAdmin} />} />,
        <Route key={`${locale}-entry`} path={`/${locale}/entry`} element={<EntryPage workspace={workspace} setWorkspace={setWorkspace} admin={admin} />} />,
        <Route key={`${locale}-entry-id`} path={`/${locale}/entry/:id`} element={<EntryPage workspace={workspace} setWorkspace={setWorkspace} admin={admin} />} />,
        <Route key={`${locale}-provider`} path={`/${locale}/p/:id`} element={<ProviderPage workspace={workspace} setWorkspace={setWorkspace} admin={admin} />} />,
      ])}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  const location = useLocation();
  const locale = localeFromPath(location.pathname) as Locale;
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [admin, setAdmin] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.me()
      .then((me) => {
        if (!cancelled) setAdmin(me.admin);
      })
      .catch((error) => {
        if (!cancelled && isAccessDenied(error)) setDenied(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (denied) return;
    api.workspace()
      .then((data) => {
        if (cancelled || !data.workspace?.providers?.length) return;
        setWorkspace(normaliseWorkspace({ ...data.workspace, favorites: data.workspace.favorites || [], appliedPacks: data.workspace.appliedPacks || [] }, WORKSPACE_ID));
        if (data.admin) setAdmin(true);
      })
      .catch((error) => {
        if (!cancelled && isAccessDenied(error)) setDenied(true);
      });
    return () => {
      cancelled = true;
    };
  }, [admin, denied]);

  return (
    <I18nProvider locale={locale}>
      {denied ? <AccessDeniedPage /> : <AppRoutes workspace={workspace} setWorkspace={setWorkspace} admin={admin} setAdmin={setAdmin} />}
    </I18nProvider>
  );
}
