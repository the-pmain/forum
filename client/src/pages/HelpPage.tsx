import { Link } from "react-router";
import { useI18n, withLocale } from "../i18n/context.tsx";
import { Icon } from "../lib/icons.tsx";

export function HelpPage() {
  const { t, locale } = useI18n();
  return (
    <main className="help-page">
      <div className="help-page-inner">
        <Link className="btn" to={withLocale(locale, "/")}>
          <Icon name="left" /> {t("help.back")}
        </Link>
        <h1>{t("help.title")}</h1>
        <p className="muted">{t("help.lead")}</p>
        <div className="help-body">
          <div className="help-grid">
            <div className="help-card">
              <h3>Find a provider</h3>
              <p>Choose a country on the left, select a category and type a name or keyword. Filters work together. Clear them to return to all records.</p>
            </div>
            <div className="help-card">
              <h3>Make it yours</h3>
              <p>Visitors can save a personal shortlist in this browser. Adding, editing or deleting a shared record needs an admin session. Deleting moves a provider to Trash.</p>
            </div>
          </div>
          <h3>Understand the country flags</h3>
          <p>
            <span className="pill listed">Listed in source</span> A local market/service appeared in a reviewed source; this is not account approval.
            <br />
            <span className="pill check">Check needed</span> Eligibility still needs confirmation.
            <br />
            <span className="pill limited">Limited</span> <span className="pill restricted">Restricted</span> Read the specific restriction before use.
          </p>
          <h3>Loans & credit</h3>
          <p>Product entries are local offers, not separate banks or personal approvals. Instant or quick responses are not guaranteed payouts. The directory does not submit applications. Home-secured borrowing puts the home or pledged assets at risk.</p>
          <h3>Cards and smaller-credit shortcuts</h3>
          <p>Credit cards shows card products. Small-credit options is a manually maintained group of records with published smaller loan principals, card facilities or draw amounts. New additions shows the latest card/small-credit pack.</p>
          <h3>Older applicants</h3>
          <p>Read the application-age rule, age at final repayment and pension requirements separately. Only “No cap (explicit)” means the cited product page explicitly says there is no maximum age; it still does not guarantee eligibility.</p>
          <h3>Privacy</h3>
          <p>Saved providers stay in this browser. Admin edits persist through the Express API to Postgres via Supabase PostgREST when configured, or in server memory during local development. Do not enter private client or account information in notes.</p>
        </div>
      </div>
    </main>
  );
}
