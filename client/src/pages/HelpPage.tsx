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
              <p>Visitors can save a personal shortlist in this browser. Adding, editing, hiding or deleting a shared record needs an admin PIN. Hidden records stay visible to the admin with a Hidden mark.</p>
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
          <p>Product entries are local offers, not separate banks or personal approvals. Instant or quick responses are not guaranteed payouts. The directory does not submit applications. Home-secured borrowing puts the home or pledged assets at risk. Brokers and comparison sites are listed under Compare &amp; arrange; they are not lenders.</p>
          <h3>Netherlands catalogue</h3>
          <p>The 19 September 2026 NL consumer-credit snapshot is mapped into this schema. Credit limits, purchase values, mortgage principals and monthly student entitlements are different units. Application age is kept separate from repayment age. Null amounts, ages or BKR fields were not replaced with zero, 18, unlimited or “no BKR”. Review-hold records stay in an editorial queue; legacy/existing-only records are kept out of new-offer results.</p>
          <h3>Finland, Sweden, Norway, Denmark and Germany</h3>
          <p>The 19 September 2026 Nordics/Germany snapshot (210 records) keeps amounts in EUR, SEK, NOK or DKK — local “kr” figures are not imported as euro. Credit-check and credit-reporting fields stay separate; empty bureau lists mean not confirmed, not “no check”. Publication statuses starting with hold_ stay in the editorial queue. Brokers and comparison sites describe a panel, not a universal loan, and are listed under Compare &amp; arrange.</p>
          <h3>Cards, shortcuts and cross-filters</h3>
          <p>Use Cards &amp; overdrafts, Personal &amp; senior, Shopping &amp; BNPL, Car finance, Mortgages &amp; home equity, Retirement borrowing, and Public &amp; student as product groups. Small amount, senior, homeowner and self-employed are cross-filters, not extra lender lists.</p>
          <h3>Mining solutions</h3>
          <p>Europe-focused hashrate products that can send BTC to an external wallet. A green withdrawal rating is not a profitability or instant-payout guarantee. Country profiles start as Check until local terms are verified.</p>
          <h3>P2P crypto</h3>
          <p>The 19 September 2026 European P2P snapshot (7 records) is user-supplied and not independently verified. All records stay on review hold, off the public new-offer list. Websites, amounts and ages were not invented. Exchange-based P2P is not the same as a non-custodial marketplace. Country profiles start as Check except claimed restrictions such as a Netherlands suspension.</p>
          <h3>Older applicants</h3>
          <p>Read the application-age rule, age at final repayment and pension requirements separately. Only “No cap (explicit)” means the cited product page explicitly says there is no maximum age; it still does not guarantee eligibility.</p>
          <h3>Privacy</h3>
          <p>Saved providers stay in this browser. The directory ships with the app; admin verify/hide/edit changes stay in server memory until restart. Comments are stored in Postgres when Supabase is configured. Admin comments are listed first. Do not enter private client or account information in notes.</p>
        </div>
      </div>
    </main>
  );
}
