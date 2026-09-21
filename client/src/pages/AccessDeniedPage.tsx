import { useI18n } from "../i18n/context.tsx";

export function AccessDeniedPage() {
  const { t } = useI18n();
  return (
    <main className="admin-page">
      <div className="admin-card">
        <h1>{t("access.deniedTitle")}</h1>
        <p>{t("access.deniedBody")}</p>
      </div>
    </main>
  );
}
