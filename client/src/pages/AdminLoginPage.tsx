import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useI18n, withLocale } from "../i18n/context.tsx";
import { api } from "../lib/api.ts";
import { Icon } from "../lib/icons.tsx";

export function AdminLoginPage({ admin, onAuth }: { admin: boolean; onAuth: (value: boolean) => void }) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.login(password);
      onAuth(true);
      navigate(withLocale(locale, "/"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await api.logout();
    onAuth(false);
  }

  return (
    <main className="admin-page">
      <div className="admin-card">
        <div className="brand-mark admin-mark">
          <Icon name="compass" />
        </div>
        <h1>{t("admin.title")}</h1>
        <p>{t("admin.lead")}</p>
        {admin ? (
          <>
            <div className="callout">{t("admin.signedIn")}</div>
            <div className="admin-actions">
              <button className="btn" type="button" onClick={signOut}>{t("admin.signOut")}</button>
              <Link className="btn btn-primary" to={withLocale(locale, "/")}>{t("admin.back")}</Link>
            </div>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <label className="field">
              <span>{t("admin.password")}</span>
              <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error ? <div className="form-error" role="alert">{error}</div> : null}
            <div className="admin-actions">
              <Link className="btn" to={withLocale(locale, "/")}>{t("admin.back")}</Link>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                <Icon name="check" /> {t("admin.submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
