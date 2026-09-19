import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ADMIN_PIN_LENGTH } from "@shared/constants.ts";
import { useI18n, withLocale } from "../i18n/context.tsx";
import { api } from "../lib/api.ts";
import { Icon } from "../lib/icons.tsx";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

export function AdminLoginPage({ admin, onAuth }: { admin: boolean; onAuth: (value: boolean) => void }) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  const submit = useCallback(async (pin: string) => {
    if (submitting.current || pin.length !== ADMIN_PIN_LENGTH) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await api.login(pin);
      onAuth(true);
      navigate(withLocale(locale, "/"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.wrongPin"));
      setDigits("");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }, [locale, navigate, onAuth, t]);

  function pushDigit(value: string) {
    if (busy || admin) return;
    setError("");
    setDigits((current) => {
      if (current.length >= ADMIN_PIN_LENGTH) return current;
      const next = `${current}${value}`;
      if (next.length === ADMIN_PIN_LENGTH) queueMicrotask(() => { void submit(next); });
      return next;
    });
  }

  function onKey(key: (typeof KEYS)[number]) {
    if (key === "clear") {
      setDigits("");
      setError("");
      return;
    }
    if (key === "back") {
      setDigits((current) => current.slice(0, -1));
      return;
    }
    pushDigit(key);
  }

  useEffect(() => {
    function onWindowKey(event: KeyboardEvent) {
      if (admin || busy) return;
      if (event.key >= "0" && event.key <= "9") {
        event.preventDefault();
        pushDigit(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        onKey("back");
      } else if (event.key === "Escape") {
        onKey("clear");
      }
    }
    window.addEventListener("keydown", onWindowKey);
    return () => window.removeEventListener("keydown", onWindowKey);
  }, [admin, busy]);

  async function signOut() {
    await api.logout();
    onAuth(false);
  }

  return (
    <main className="admin-page">
      <div className="admin-card pin-card">
        <Link className="pin-back" to={withLocale(locale, "/")}>
          <Icon name="left" /> {t("admin.back")}
        </Link>
        <h1>{t("admin.title")}</h1>
        <p>{t("admin.lead")}</p>
        {admin ? (
          <>
            <div className="callout">{t("admin.signedIn")}</div>
            <div className="admin-actions">
              <button className="btn" type="button" onClick={signOut}>{t("admin.signOut")}</button>
              <Link className="btn btn-primary" to={withLocale(locale, "/")}>{t("admin.openDirectory")}</Link>
            </div>
          </>
        ) : (
          <>
            <div className="pin-slots" aria-label={t("admin.pinLabel")}>
              {Array.from({ length: ADMIN_PIN_LENGTH }, (_, index) => (
                <span key={index} className={`pin-slot${index < digits.length ? " is-filled" : ""}${error ? " is-error" : ""}`} />
              ))}
            </div>
            {error ? <div className="form-error pin-error" role="alert">{error}</div> : null}
            <div className="pin-pad" role="group" aria-label={t("admin.padLabel")}>
              {KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`pin-key${key === "clear" || key === "back" ? " is-meta" : ""}`}
                  disabled={busy}
                  onClick={() => onKey(key)}
                >
                  {key === "clear" ? t("admin.clear") : key === "back" ? <Icon name="delete" /> : key}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
