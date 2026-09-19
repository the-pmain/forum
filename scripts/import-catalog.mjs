import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const htmlPath = path.join(root, "Financial_Navigator_Cards_and_Small_Credit.html");
const nlCandidates = [
  path.join("C:/Users/2/Downloads/netherlands-consumer-credit-database.md"),
  path.join(root, "../.cursor/projects/c-Users-2-projects-forum/uploads/c__Users_2_Downloads_netherlands-consumer-credit-database-L1-L8524-1.md"),
  "C:/Users/2/.cursor/projects/c-Users-2-projects-forum/uploads/c__Users_2_Downloads_netherlands-consumer-credit-database-L1-L8524-1.md",
];
const europeCandidates = [
  path.join("C:/Users/2/Downloads/nordics-germany-consumer-credit-database.md"),
  path.join(root, "../.cursor/projects/c-Users-2-projects-forum/uploads/c__Users_2_Downloads_nordics-germany-consumer-credit-database-L1-L13645-0.md"),
  "C:/Users/2/.cursor/projects/c-Users-2-projects-forum/uploads/c__Users_2_Downloads_nordics-germany-consumer-credit-database-L1-L13645-0.md",
];
const p2pCandidates = [
  path.join("C:/Users/2/Downloads/european-p2p-crypto-services-database.md"),
  path.join(root, "../.cursor/projects/c-Users-2-projects-forum/uploads/c__Users_2_Downloads_european-p2p-crypto-services-database-L1-L606-0.md"),
  "C:/Users/2/.cursor/projects/c-Users-2-projects-forum/uploads/c__Users_2_Downloads_european-p2p-crypto-services-database-L1-L606-0.md",
];

const NL_PACK_ID = "nl-consumer-credit-2026-09-19-v1";
const EUROPE_PACK_ID = "nordics-germany-consumer-credit-2026-09-19-v1";
const MINING_PACK_ID = "mining-solutions-europe-2026-09-19-v1";
const P2P_PACK_ID = "europe-p2p-crypto-2026-09-19-v1";
const COUNTRIES = ["Netherlands", "Germany", "Denmark", "Finland", "Norway", "Sweden"];
const ISO_COUNTRY = {
  NL: "Netherlands",
  DE: "Germany",
  DK: "Denmark",
  FI: "Finland",
  NO: "Norway",
  SE: "Sweden",
};

const LOAN_TYPE = {
  credit_card: "Credit card",
  bank_overdraft: "Overdraft / credit line",
  personal_loan: "Personal loan",
  senior_loan: "Senior loan",
  revolving_credit: "Revolving / retail credit",
  retail_credit: "Revolving / retail credit",
  bnpl: "BNPL / pay later",
  device_finance: "Device / hire purchase",
  car_finance: "Car finance",
  private_lease_adjacent: "Private lease (adjacent)",
  mortgage: "Home-secured / equity release",
  home_equity_loan: "Home-secured / equity release",
  bridging_loan: "Bridging loan",
  public_purpose_loan: "Public / municipal scheme",
  public_secured_loan: "Public / municipal scheme",
  education_loan: "Student / education loan",
  social_loan: "Social / pawn credit",
  debt_resolution: "Social / pawn credit",
  pawn_credit: "Social / pawn credit",
  securities_secured_credit: "Securities-secured credit",
  other_secured_credit: "Other secured / private",
  private_family_loan: "Other secured / private",
  small_short_term_loan: "Short-term miniloan",
  small_loan: "Short-term miniloan",
  overdraft: "Overdraft / credit line",
  home_equity: "Home-secured / equity release",
  senior_equity_release: "Senior loan",
  student_loan: "Student / education loan",
  social_loan: "Public / municipal scheme",
  pawn_loan: "Social / pawn credit",
  securities_credit: "Securities-secured credit",
  home_improvement_loan: "Public / municipal scheme",
  building_savings: "Home-secured / equity release",
};

const AMOUNT_BASIS = {
  credit_limit: "Published credit limit",
  loan_principal: "Loan principal",
  purchase_value: "Purchase value",
  financed_device_price: "Financed device price",
  financed_vehicle_price: "Financed vehicle price",
  total_lease_obligation: "Total lease obligation",
  available_equity_in_old_home: "Available equity in the old home",
  monthly_entitlement: "Monthly student entitlement",
  eligible_annual_tuition: "Eligible annual tuition",
  privately_agreed_principal: "Privately agreed principal",
  periodic_support_for_higher_vve_contributions: "Periodic VvE contribution support",
  not_applicable: "Not a loan-product amount range",
  approved_credit_limit: "Published credit limit",
  location_and_household_dependent: "Location and household dependent",
  monthly_guarantee_allowance: "Monthly guarantee allowance",
  advertised_panel_loan_span: "Advertised panel loan span (not a universal loan)",
  minimum_draw_and_maximum_limit: "Minimum draw and maximum limit",
  weekly_allowance: "Weekly allowance",
  monthly_study_support: "Monthly student entitlement",
  monthly_card_credit: "Monthly card credit",
  monthly_support_or_programme_limit: "Monthly support or programme limit",
  programme_ceiling_per_dwelling: "Programme ceiling per dwelling",
  monthly_disbursement: "Monthly disbursement",
  total_per_education_stage: "Total per education stage",
};

const SECURITY = {
  unsecured: "Unsecured",
  mortgage_on_home: "Home-secured",
  second_mortgage_on_home: "Home-secured",
  mortgage_security_on_old_and_or_new_home: "Home-secured",
  positive_negative_mortgage_declaration: "Home-secured",
  scheme_specific_home_security: "Home-secured",
  mortgage_or_scheme_specific_property_security: "Home-secured",
  mortgage_on_eligible_monument: "Home-secured",
  scheme_specific_home_related_claim: "Home-secured",
  mortgage_on_financed_property: "Home-secured",
  unsecured_or_notarial_mortgage_by_agreement: "Home / other assets",
  vehicle_legal_title_retained_until_paid: "Vehicle / retained title",
  vehicle_title_or_security_per_contract: "Vehicle / retained title",
  vehicle_title_retained_until_final_payment: "Vehicle / retained title",
  lessor_owns_vehicle: "Vehicle / retained title",
  pledged_jewellery_or_watch: "Pledge / other assets",
  pledged_gold_or_silver_jewellery: "Pledge / other assets",
  pledged_investment_portfolio: "Pledge / other assets",
  personal_guarantor_required: "Pledge / other assets",
  lender_dependent: "Lender-dependent",
  existing_contract_terms: "Lender-dependent",
};

function fold(value) {
  return String(value || "")
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function clip(value, max) {
  const text = String(value || "").trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() : text;
}

function safeURL(value) {
  try {
    const url = new URL(String(value).trim());
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

function uniqueUrls(values) {
  return [...new Set((values || []).map(safeURL).filter(Boolean))];
}

function readMarkdown(candidates, label) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate, "utf8");
  }
  throw new Error(`${label} markdown not found.`);
}

function parseJsonRecords(markdown, expected, label, keyCount = 41) {
  const records = [];
  for (const match of markdown.matchAll(/```json\s*\n([\s\S]*?)\n```/g)) {
    records.push(JSON.parse(match[1]));
  }
  if (records.length !== expected) {
    throw new Error(`Expected ${expected} ${label} records, found ${records.length}.`);
  }
  const ids = new Set();
  for (const record of records) {
    if (!record.id || ids.has(record.id) || Object.keys(record).length !== keyCount) {
      throw new Error(`Invalid ${label} record ${record.id || "(missing id)"} (${Object.keys(record).length} fields).`);
    }
    ids.add(record.id);
  }
  return records;
}

function humanizeClaim(value) {
  if (value == null || value === "") return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).replaceAll("_", " ");
}

function claimedList(values, fallback) {
  const items = Array.isArray(values) ? values.map((item) => String(item || "").trim()).filter(Boolean) : [];
  return items.length ? items.join(", ") : fallback;
}

function loanType(record) {
  const mapped = LOAN_TYPE[record.category];
  if (!mapped) throw new Error(`Unmapped category ${record.category} (${record.id}).`);
  return mapped;
}

function isPlatform(record) {
  return ["comparison_platform", "credit_broker", "comparison", "broker"].includes(record.category)
    || ["broker", "broker_comparison", "comparison_and_broker"].includes(record.role);
}

function publicationStatus(record) {
  const status = String(record.publication_status || "");
  if (status === "review_hold" || status.startsWith("hold_")) return "review_hold";
  if (status === "do_not_publish_as_new_offer") return "legacy";
  return "publish";
}

function countryStatus(record) {
  const pub = publicationStatus(record);
  if (pub === "review_hold") return "Check";
  if (pub === "legacy") return "Restricted";
  const listedEvidence = ["primary_source", "primary_source_checked", "merchant_primary_source_checked"].includes(record.verification_status);
  switch (record.availability) {
    case "open":
    case "open_to_applications":
      return listedEvidence ? "Listed" : "Check";
    case "local_scheme":
    case "scheme_dependent":
    case "case_assessed":
    case "by_agreement":
    case "merchant_dependent":
      return "Limited";
    case "existing_customers":
    case "closed_to_new":
    case "discontinued":
    case "not_verified_for_new_business":
      return "Restricted";
    case "advertised_not_fully_verified":
    case "listed_contact_bank_for_terms":
    case "product_listed_application_terms_require_confirmation":
      return "Check";
    default:
      return "Check";
  }
}

function formatAmount(record) {
  const basis = AMOUNT_BASIS[record.amount_basis]
    || String(record.amount_basis || "").replaceAll("_", " ")
    || "Amount basis not established";
  const notes = record.amount_notes || "";
  const currency = record.currency || (record.amount_min_eur != null || record.amount_max_eur != null ? "EUR" : "");
  const min = record.amount_min_eur ?? record.amount_min;
  const max = record.amount_max_eur ?? record.amount_max;
  const parts = [];
  if (min != null) parts.push(`from ${currency} ${min}`.trim());
  if (max != null) parts.push(`up to ${currency} ${max}`.trim());
  const range = parts.join(" ");
  const text = [range, notes].filter(Boolean).join(". ") || "Not verified";
  return {
    text,
    basis,
    value: typeof min === "number" ? min : null,
  };
}

function ageEligibility(record) {
  if (record.age_min == null && record.age_max_at_application == null) return record.age_notes || "Not verified";
  const parts = [];
  if (record.age_min != null) {
    if (record.age_min_inclusive === true) parts.push(`From ${record.age_min}`);
    else if (record.age_min_inclusive === false) parts.push(`Over ${record.age_min}`);
    else parts.push(`Minimum age ${record.age_min}; inclusive boundary not verified`);
  }
  if (record.age_max_at_application != null) {
    const before = record.age_application_max_inclusive === false;
    let bit = before
      ? `application must be before ${record.age_max_at_application}`
      : `up to ${record.age_max_at_application} at application`;
    if (record.age_max_application_basis) bit += ` (${String(record.age_max_application_basis).replaceAll("_", " ")})`;
    parts.push(bit);
  }
  return parts.join(", ");
}

function classifySecurity(value) {
  if (SECURITY[value]) return SECURITY[value];
  const text = String(value || "").toLowerCase();
  if (!text) return "Lender-dependent";
  if (text.includes("vehicle") || text.includes("retention of title")) return "Vehicle / retained title";
  if (text.includes("pledged") || text.includes("jewellery") || text.includes("securities") || text.includes("investment")) {
    return "Pledge / other assets";
  }
  if (text.includes("platform itself does not") || text.includes("selected lender") || text.includes("financing partner")) {
    return "Lender-dependent";
  }
  if (text.includes("or other accepted assets") || text.includes("need not always be real estate") || text.includes("without a land-register") || text.includes("without a registered grundschuld")) {
    return "Home / other assets";
  }
  if (text.includes("unsecured") || text.includes("no property") || text.includes("no home security") || text.includes("statutory student") || text.includes("public student") || text.includes("public social-benefit") || text.includes("no ordinary pledged")) {
    return "Unsecured";
  }
  if (text.includes("property") || text.includes("home security") || text.includes("housing") || text.includes("mortgage") || text.includes("grundschuld") || text.includes("owner-occupied") || text.includes("dwelling") || text.includes("land-register")) {
    return "Home-secured";
  }
  return "Lender-dependent";
}

function creditLine(record) {
  const systems = Array.isArray(record.credit_systems) ? record.credit_systems.filter(Boolean) : [];
  return [
    record.credit_check,
    record.credit_reporting,
    systems.length ? `Named systems in source: ${systems.join(", ")}.` : "",
    record.income_pension_eligibility || record.income,
  ].filter(Boolean).join(" ");
}

function upperAge(record) {
  if (record.age_max_at_application == null && record.age_max_at_repayment == null) {
    return {
      status: "Not stated in source",
      text: record.age_notes || "Upper application and repayment ages not established in the cited public material. Null does not mean unrestricted.",
    };
  }
  const parts = [];
  if (record.age_max_at_application != null) {
    parts.push(
      record.age_application_max_inclusive === false
        ? `Application must be before age ${record.age_max_at_application}.`
        : `Published application maximum ${record.age_max_at_application}.`,
    );
  }
  if (record.age_max_at_repayment != null) {
    parts.push(
      record.age_repayment_deadline_exclusive
        ? `Repayment must finish before age ${record.age_max_at_repayment}.`
        : `Published repayment-age limit ${record.age_max_at_repayment}.`,
    );
  }
  if (record.age_notes) parts.push(record.age_notes);
  return { status: "Published cap", text: parts.join(" ") };
}

function payoffAge(record) {
  if (record.age_max_at_repayment == null) return "Not verified";
  return record.age_repayment_deadline_exclusive
    ? `Must finish before ${record.age_max_at_repayment}`
    : `Published repayment-age limit ${record.age_max_at_repayment}`;
}

function termText(record) {
  if (record.term_months_min == null && record.term_months_max == null) return "";
  const parts = [];
  if (record.term_months_min != null) parts.push(`from ${record.term_months_min} months`);
  if (record.term_months_max != null) parts.push(`up to ${record.term_months_max} months`);
  return parts.join(" ");
}

function bkrLine(record) {
  const check = record.bkr_check == null ? "not established" : String(record.bkr_check).replaceAll("_", " ");
  const registration = record.bkr_registration == null ? "not established" : String(record.bkr_registration).replaceAll("_", " ");
  const notes = record.bkr_notes || "";
  return [`BKR check: ${check}.`, `BKR registration: ${registration}.`, notes].filter(Boolean).join(" ");
}

function availabilityNote(record) {
  const bits = [
    `Availability: ${String(record.availability || "").replaceAll("_", " ")}.`,
    `Verification: ${String(record.verification_status || "").replaceAll("_", " ")}.`,
    record.variants?.length ? `Variants: ${record.variants.join("; ")}.` : "",
    record.cautions || "",
  ];
  return bits.filter(Boolean).join(" ");
}

function catalogTags(record) {
  const extra = [];
  const tags = Array.isArray(record.tags) ? [...record.tags] : [];
  if (tags.includes("feature:small_amount") || tags.includes("amount:small_minimum")) extra.push("amount:small");
  if (
    tags.includes("feature:senior")
    || tags.includes("feature:senior_eligible")
    || tags.includes("feature:age_55_plus")
    || tags.includes("feature:age_60_plus")
    || tags.includes("feature:pensioners")
    || record.category === "senior_equity_release"
  ) {
    extra.push("audience:senior");
  }
  if (
    tags.includes("security:property")
    || tags.includes("feature:home_equity")
    || tags.includes("feature:mortgage")
    || tags.includes("feature:property_security")
    || tags.includes("feature:home_purchase")
    || tags.includes("feature:second_mortgage")
  ) {
    extra.push("eligibility:homeowner");
  }
  return [...new Set([...extra, ...tags])];
}

function mapCatalogRecord(record, origin) {
  const platform = isPlatform(record);
  const country = ISO_COUNTRY[record.country];
  if (!country) throw new Error(`Unmapped country ${record.country} (${record.id}).`);
  const name = clip(`${record.provider}: ${record.product_name}`, 120);
  const website = safeURL(record.website);
  const sources = uniqueUrls([...(record.sources || []), record.website]);
  const amount = formatAmount(record);
  const upper = upperAge(record);
  const pub = publicationStatus(record);
  const status = countryStatus(record);
  const tags = catalogTags(record);
  const security = classifySecurity(record.security);
  const type = platform ? null : loanType(record);
  const smallCredit = tags.includes("amount:small") || tags.includes("feature:small_amount") || type === "Short-term miniloan";
  const dutch = origin.startsWith("nl-consumer-credit");
  const countryEntry = {
    status,
    note: clip(availabilityNote(record), 30000),
    age: clip(record.age_notes || "", 1000),
    url: website || undefined,
  };
  if (countryEntry.url === undefined) delete countryEntry.url;
  const provider = {
    id: record.id,
    name,
    category: platform ? "Aggregators" : "Loans & credit",
    website,
    service: clip(
      [
        record.product_name,
        record.record_type && record.record_type !== "product" ? `(${String(record.record_type).replaceAll("_", " ")})` : "",
        record.subcategory ? String(record.subcategory).replaceAll("_", " ") : "",
        record.cautions,
      ].filter(Boolean).join(" — "),
      500,
    ),
    countryFocus: country,
    countries: { [country]: countryEntry },
    limitations: clip(
      [
        record.cautions,
        record.cash_access ? `Cash access: ${String(record.cash_access).replaceAll("_", " ")}.` : "",
        record.distribution ? `Distribution: ${String(record.distribution).replaceAll("_", " ")}.` : "",
        record.role ? `Role: ${String(record.role).replaceAll("_", " ")}.` : "",
      ].filter(Boolean).join(" "),
      30000,
    ),
    ageEligibility: clip(ageEligibility(record), 1000),
    ageEvidence: record.age_min != null || record.age_max_at_application != null || record.age_max_at_repayment != null
      ? "Verified"
      : "Not verified",
    ageNotes: clip(record.age_notes || "", 30000),
    upperAge: clip(upper.text, 30000),
    upperAgeStatus: upper.status,
    sources: { age: sources.slice(0, 20), service: sources },
    reviewNote: clip(
      [
        dutch
          ? `NL consumer-credit snapshot 19 September 2026 (${record.publication_status}; ${record.verification_status}).`
          : `Nordics/Germany consumer-credit snapshot 19 September 2026 (${record.publication_status}; ${record.verification_status}). Amounts remain in ${record.currency}.`,
        record.shared_rules?.length ? `Shared rules: ${record.shared_rules.join(", ")}.` : "",
        dutch
          ? "Listing is not acceptance. Amounts, ages and BKR values are as published; null was not replaced with 18, zero, unlimited or no-BKR."
          : "Listing is not acceptance. Null amounts, ages or bureau fields were not replaced with zero, 18, unlimited or no-check. Brokers describe a panel, not a universal loan.",
      ].filter(Boolean).join(" "),
      30000,
    ),
    sourceDate: record.last_checked || "2026-09-19",
    origin,
    notes: "",
    updatedAt: `${record.last_checked || "2026-09-19"}T12:00:00.000Z`,
    publicationStatus: pub,
    tags,
    providerGroupId: record.provider_group_id || "",
  };
  if (!platform) {
    provider.lending = {
      lender: clip(record.provider, 30000),
      type,
      minimum: clip(amount.text, 30000),
      minimumBasis: clip(amount.basis, 30000),
      currency: record.currency || (dutch ? "EUR" : ""),
      channel: clip(String(record.distribution || "").replaceAll("_", " "), 30000),
      decision: "Standard / not verified",
      payout: clip(record.cash_access ? `Cash access: ${String(record.cash_access).replaceAll("_", " ")}.` : "Not verified", 30000),
      speed: "Standard / not verified",
      security,
      eligibility: clip((dutch ? [bkrLine(record), record.income] : [creditLine(record)]).filter(Boolean).join(" "), 30000),
      payoffAge: payoffAge(record),
      retirement: clip(record.income_pension_eligibility || record.income || "Not verified", 30000),
      costs: clip(record.cautions || "Confirm interest, fees and statutory cost caps on the current product page.", 30000),
      term: clip(termText(record), 30000),
      repayment: clip(String(record.repayment_type || record.repayment || "").replaceAll("_", " "), 30000),
      minimumValue: amount.value,
      smallCredit,
    };
  }
  return provider;
}

function mapP2pRecord(record) {
  if (record.category !== "p2p_crypto") throw new Error(`Unexpected P2P category ${record.category} (${record.id}).`);
  const pub = publicationStatus(record);
  const restrictionByCountry = new Map();
  for (const item of record.country_restrictions_claimed || []) {
    const country = ISO_COUNTRY[item?.country];
    if (country) restrictionByCountry.set(country, item);
  }
  const region = record.region_claimed || "Europe; country dependent";
  const countries = Object.fromEntries(COUNTRIES.map((country) => {
    const restriction = restrictionByCountry.get(country);
    if (restriction) {
      return [country, {
        status: "Restricted",
        note: clip([
          humanizeClaim(restriction.claim) || "Country restriction claimed.",
          restriction.effective_date_claimed ? `Claimed effective ${restriction.effective_date_claimed}.` : "",
          "Not independently verified.",
          `Region claimed: ${region}.`,
        ].filter(Boolean).join(" "), 30000),
      }];
    }
    return [country, {
      status: "Check",
      note: clip([
        `Claimed region: ${region}. Country availability was not independently verified.`,
        record.main_limitation || "",
        "Listing is not a finding that the platform is available or lawful here.",
      ].filter(Boolean).join(" "), 30000),
    }];
  }));
  const holdDays = Array.isArray(record.withdrawal_hold_days_claimed)
    ? record.withdrawal_hold_days_claimed.filter((item) => item != null)
    : [];
  const fee = record.fee_percent_max_claimed == null
    ? "Not verified"
    : [
      `Up to about ${record.fee_percent_max_claimed}% claimed`,
      record.fee_is_approximate === true ? "(approximate)" : "",
      record.fee_basis ? `(${humanizeClaim(record.fee_basis)})` : "",
    ].filter(Boolean).join(" ");
  const amount = record.transaction_amount_min == null && record.transaction_amount_max == null
    ? "Not verified"
    : [
      record.transaction_currency,
      record.transaction_amount_min != null ? `from ${record.transaction_amount_min}` : "",
      record.transaction_amount_max != null ? `up to ${record.transaction_amount_max}` : "",
    ].filter(Boolean).join(" ");
  const aliases = Array.isArray(record.aliases) ? record.aliases.filter(Boolean) : [];
  const regulatory = (record.regulatory_claims || [])
    .map((item) => [item?.as_of_claimed ? `As of ${item.as_of_claimed}:` : "", item?.claim].filter(Boolean).join(" "))
    .filter(Boolean);
  const nonCustodial = record.custody_model_claimed === "non_custodial"
    || String(record.subcategory || "").includes("non_custodial");
  return {
    id: record.id,
    name: clip(record.product_name || record.provider, 120),
    category: "P2P",
    website: safeURL(record.website),
    service: clip([
      record.product_name,
      humanizeClaim(record.subcategory),
      aliases.length ? `Also known as ${aliases.join(", ")}.` : "",
    ].filter(Boolean).join(" — "), 500),
    countryFocus: "Europe",
    countries,
    limitations: clip([
      record.main_limitation,
      record.notes,
      record.payment_method_notes,
      holdDays.length ? `Claimed withdrawal/risk-control holds: ${holdDays.join("/")} days.` : "",
      ...regulatory,
    ].filter(Boolean).join(" "), 30000),
    ageEligibility: "Not verified",
    ageEvidence: "Not verified",
    ageNotes: "",
    upperAge: "Upper age was not supplied in the source. Null does not mean unrestricted.",
    upperAgeStatus: "Not stated in source",
    sources: { age: [], service: [] },
    reviewNote: clip([
      `European P2P crypto snapshot 19 September 2026 (finance-directory-p2p/1.0; ${record.publication_status}; ${record.verification_status}).`,
      "Provider claims have not been independently verified. Websites were not in the source and were left empty.",
      "Null amounts, ages, fees and country lists were not replaced with defaults.",
      "Review-hold records stay out of the public new-offer list.",
    ].join(" "), 30000),
    sourceDate: record.last_checked || record.converted_on || "2026-09-19",
    origin: "finance-directory-p2p/1.0",
    notes: "",
    updatedAt: "2026-09-19T12:00:00.000Z",
    publicationStatus: pub,
    tags: Array.isArray(record.tags) ? record.tags : [],
    p2p: {
      productType: clip(humanizeClaim(record.subcategory) || "P2P crypto", 30000),
      custody: clip(humanizeClaim(record.custody_model_claimed) || "Not verified", 30000),
      kyc: clip(humanizeClaim(record.platform_kyc_claimed) || "Not verified", 30000),
      escrow: clip(humanizeClaim(record.escrow_model_claimed) || "Not verified", 30000),
      counterparty: clip(humanizeClaim(record.counterparty_verification_claimed) || "Not specified", 30000),
      fiat: clip(claimedList(record.fiat_currencies_claimed, record.fiat_notes || "Not enumerated in source"), 30000),
      assets: clip(claimedList(record.crypto_assets_claimed, record.crypto_notes || "Not enumerated in source"), 30000),
      payment: clip(claimedList(record.payment_methods_claimed, record.payment_method_notes || "Not enumerated in source"), 30000),
      flow: clip((record.transaction_flow_claimed || []).filter(Boolean).join(" → ") || "Not enumerated in source", 30000),
      largeTransactions: clip(humanizeClaim(record.large_transactions_claimed) || "Not verified", 30000),
      fee,
      holds: holdDays.length ? `${holdDays.join("/")} day holds claimed` : "Not enumerated in source",
      amount,
      directDelivery: record.direct_self_custody_delivery_claimed === true,
      externalWallet: String(record.external_wallet_withdrawal_claimed || "").startsWith("yes"),
      nonCustodial,
    },
  };
}

function miningProviders() {
  const europeNote = "Europe-focused mining/hashrate product. Verify current terms, KYC and availability in this country before use. Listing is not a payout guarantee.";
  const countries = Object.fromEntries(
    COUNTRIES.map((country) => [country, { status: "Check", note: europeNote, age: "18+" }]),
  );
  const common = {
    category: "Mining Solutions",
    countryFocus: "Europe",
    countries,
    ageEligibility: "18+",
    ageEvidence: "Verified",
    ageNotes: "Published 18+ requirement. Country-specific restrictions can still apply.",
    upperAge: "Not stated in source; confirm the applicable account rules. An 18+ minimum is not a statement that there is no maximum age.",
    upperAgeStatus: "Not stated in source",
    origin: "mining-solutions-europe/1.0",
    sourceDate: "2026-09-19",
    updatedAt: "2026-09-19T12:00:00.000Z",
    publicationStatus: "publish",
    notes: "",
    reviewNote: "Europe mining snapshot 19 September 2026. Mining rewards, payout thresholds, fees and supported countries can change. Verify current platform terms before treating a product as available in a specific European country.",
  };

  return [
    {
      ...common,
      id: "mining-gomining",
      name: "GoMining",
      website: "https://gomining.com/",
      service: "Buy a digital miner linked to real Bitcoin mining power. BTC rewards accumulate in the GoMining wallet for manual withdrawal.",
      limitations: "KYC required for withdrawals. At least one miner must be created or bought through GoMining before full BTC reward withdrawal is available. Recent email, password or 2FA changes can pause withdrawals for about 12 hours. EEA users may need Travel Rule information. Network fees may apply. Miner NFT transfer/sale restrictions are separate from BTC reward withdrawals.",
      sources: { age: ["https://gomining.com/"], service: ["https://gomining.com/"] },
      tags: ["Mining", "Bitcoin Mining", "Digital Miner", "Tokenized Hashrate", "BTC Rewards", "Fast Withdrawal", "External Wallet", "Non-Custodial Wallet", "Self Custody", "KYC", "18+", "Europe"],
      mining: {
        productType: "Digital Mining / Tokenized Hashrate",
        rewards: "BTC",
        kyc: "Required for withdrawals and full account functionality",
        externalWallet: true,
        nonCustodial: true,
        withdrawalSpeed: "instant_fast",
        withdrawalRating: "GREEN",
        instantWithdrawal: "Near-instant; typically up to about 1 hour after confirmation",
        payoutMethod: "Manual withdrawal from the GoMining virtual wallet to a personal Bitcoin wallet",
        withdrawalRules: "BTC rewards accumulate in the GoMining virtual wallet. User can manually withdraw to their own Bitcoin wallet after KYC. No large mining-pool threshold like BitFuFu. Security holds can apply after account-detail changes. Travel Rule information may be required for EEA users.",
        holdingRestrictions: "No general deposit holding period for BTC reward withdrawals. Some digital miner purchases may have separate restrictions before the miner NFT itself can be transferred or sold.",
        bestFor: "Users who want easy Bitcoin mining exposure with relatively fast manual withdrawals to a personal wallet.",
      },
    },
    {
      ...common,
      id: "mining-bitfufu",
      name: "BitFuFu",
      website: "https://www.bitfufu.com/",
      service: "Buy cloud mining hashrate. Bitcoin is mined through supported pools and can be paid directly to a personal Bitcoin wallet.",
      limitations: "KYC required. Standard pool payout is typically above about 0.005 BTC; smaller balances accumulate until the threshold. The customer generally cannot manually withdraw a very small mining balance on demand. Transaction fees may be deducted. Changing the receiving address may temporarily delay payouts.",
      sources: { age: ["https://www.bitfufu.com/"], service: ["https://www.bitfufu.com/"] },
      tags: ["Mining", "Cloud Mining", "Cloud Hashrate", "Bitcoin", "BTC Rewards", "Direct Wallet Payout", "External Wallet", "Non-Custodial Wallet", "KYC", "18+", "Europe", "Payout Threshold"],
      mining: {
        productType: "Cloud Mining / Cloud Hashrate",
        rewards: "BTC",
        kyc: "Required",
        externalWallet: true,
        nonCustodial: true,
        withdrawalSpeed: "daily_threshold",
        withdrawalRating: "YELLOW",
        instantWithdrawal: "No",
        payoutMethod: "Automatic mining-pool payout directly to a personal BTC wallet",
        withdrawalRules: "Mining output is calculated on a recurring basis. If earnings are above the normal payout threshold, the pool initiates payment. Below the threshold, BTC accumulates. After a plan ends, lower final-payout thresholds may apply depending on the selected pool.",
        holdingRestrictions: "No general deposit holding period identified. The main restriction is the mining-pool payout threshold.",
        bestFor: "Users who want cloud mining with automatic BTC payouts directly to their personal wallet and do not require instant access to small mining balances.",
      },
    },
    {
      ...common,
      id: "mining-bitdeer",
      name: "Bitdeer",
      website: "https://www.bitdeer.com/",
      service: "Purchase a Bitcoin cloud-hashrate plan and receive mining-pool revenue to a chosen Bitcoin wallet.",
      limitations: "KYC can be required depending on service level and activity. Money used to buy a plan purchases a mining service/contract, not a freely withdrawable wallet balance. Electricity fees may apply; mining may stop if they are not maintained. Plans have defined contract periods. Final remaining output after a plan ends may take additional working days.",
      sources: { age: ["https://www.bitdeer.com/"], service: ["https://www.bitdeer.com/"] },
      tags: ["Mining", "Cloud Mining", "Bitcoin", "Cloud Hashrate", "External Wallet", "Personal Wallet", "Non-Custodial Wallet", "Electricity Fee", "Mining Contract", "18+", "KYC", "Europe"],
      mining: {
        productType: "Cloud Mining / Cloud Hashrate",
        rewards: "BTC",
        kyc: "Required depending on service level and transaction activity",
        externalWallet: true,
        nonCustodial: true,
        withdrawalSpeed: "pool_threshold",
        withdrawalRating: "YELLOW",
        instantWithdrawal: "No",
        payoutMethod: "Mining pool sends mining revenue to the BTC receiving address attached to the mining plan",
        withdrawalRules: "Customer can enter a personal BTC wallet as the receiving address. Payments depend on the selected pool's payout threshold and settlement schedule. Very small mining balances may remain unpaid until the pool minimum is reached.",
        holdingRestrictions: "No general cash deposit holding rule. Contract terms, pool thresholds and electricity-fee maintenance apply.",
        bestFor: "Users who want direct mining-pool payments to a personal BTC wallet but do not require instant access to mining rewards.",
      },
    },
    {
      ...common,
      id: "mining-nicehash",
      name: "NiceHash",
      website: "https://www.nicehash.com/",
      service: "Hashrate marketplace where users can buy hashing power or use EasyMining products. Primarily connects buyers and sellers of computing power.",
      limitations: "KYC may be required depending on jurisdiction, account activity and wallet functionality. Minimum withdrawal amounts and fees can change. Security and compliance checks can delay withdrawals. EasyMining and purchased hashrate do not guarantee profitable mining output. If hashpower is directed to an external pool, that pool controls payout rules.",
      sources: { age: ["https://www.nicehash.com/"], service: ["https://www.nicehash.com/"] },
      tags: ["Mining", "Hashrate", "Hashrate Marketplace", "EasyMining", "Bitcoin", "BTC", "External Wallet", "Non-Custodial Wallet", "Fast Withdrawal", "18+", "Europe"],
      mining: {
        productType: "Hashrate Marketplace / EasyMining",
        rewards: "BTC-focused",
        kyc: "May be required depending on jurisdiction, account activity and wallet functionality",
        externalWallet: true,
        nonCustodial: true,
        withdrawalSpeed: "instant_fast",
        withdrawalRating: "GREEN_YELLOW",
        instantWithdrawal: "Partially / near-instant depending on conditions; not guaranteed instant",
        payoutMethod: "BTC held in the NiceHash wallet can generally be manually withdrawn to an external Bitcoin wallet",
        withdrawalRules: "Available BTC wallet balances can usually be withdrawn without waiting for a mining contract to end. Blockchain confirmation times, KYC and security checks can affect speed. Check current withdrawal limits in the account.",
        holdingRestrictions: "Generally no normal fixed deposit holding period. Security, compliance and minimum-withdrawal rules may still apply.",
        bestFor: "Users who want flexible mining/hashrate exposure and relatively easy movement of available BTC balances to a personal wallet.",
      },
    },
  ];
}

function extractHtmlSeed() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const seedStart = html.indexOf('<script id="seed-data" type="application/json">');
  const seedEnd = html.indexOf("</script>", seedStart);
  if (seedStart < 0 || seedEnd < 0) throw new Error("HTML seed not found");
  return JSON.parse(html.slice(html.indexOf(">", seedStart) + 1, seedEnd));
}

function uniqueProviders(list) {
  const ids = new Set();
  const names = new Set();
  const out = [];
  for (const provider of list) {
    if (ids.has(provider.id)) continue;
    ids.add(provider.id);
    let name = provider.name;
    let key = fold(name);
    if (names.has(key)) {
      const country = provider.countryFocus || "";
      name = clip(country ? `${provider.name} (${country})` : `${provider.name} [${provider.id}]`, 120);
      key = fold(name);
      if (names.has(key)) name = clip(`${provider.name} [${provider.id}]`, 120);
    }
    names.add(fold(name));
    out.push({ ...provider, name });
  }
  return out;
}

const WORKSPACE_ID = "nl-de-nordics-2026-v1";
const CATALOG_JSON_TAG = "$jn$";
const CATALOG_BATCH_SIZE = 10;
const CATALOG_MERGE_NOTE =
  " NL consumer-credit catalogue and Europe mining solutions merged 19 September 2026.";

function jsonSql(value) {
  const json = JSON.stringify(value);
  if (json.includes(CATALOG_JSON_TAG)) {
    throw new Error("Catalog JSON contains the SQL dollar-quote tag; pick another tag.");
  }
  return `${CATALOG_JSON_TAG}${json}${CATALOG_JSON_TAG}`;
}

function writeCatalogSql(seed) {
  const providers = seed.providers || [];
  const skeleton = { ...seed, providers: [] };
  const catalogDir = path.join(root, "sql", "003");
  const batchCount = Math.max(1, Math.ceil(providers.length / CATALOG_BATCH_SIZE));

  fs.mkdirSync(catalogDir, { recursive: true });
  for (const name of fs.readdirSync(catalogDir)) {
    if (name.endsWith(".sql")) fs.unlinkSync(path.join(catalogDir, name));
  }

  for (let i = 0; i < providers.length; i += CATALOG_BATCH_SIZE) {
    const part = providers.slice(i, i + CATALOG_BATCH_SIZE);
    const n = Math.floor(i / CATALOG_BATCH_SIZE) + 1;
    const label = String(n).padStart(2, "0");
    const fileName = `p${label}.sql`;
    const first = part[0]?.id || "none";
    const last = part[part.length - 1]?.id || "none";
    fs.writeFileSync(
      path.join(catalogDir, fileName),
      `-- Batch ${n}/${batchCount}: ${part.length} providers (${first} ... ${last}).
-- Idempotent. Run after sql/003_merge_catalog.sql. One file per agent turn.

update public.navigator_workspace as w
set
  payload = jsonb_set(
    w.payload,
    '{providers}',
    (
      select coalesce(jsonb_agg(elem order by ord), '[]'::jsonb)
      from (
        select e as elem, ordinality as ord
        from jsonb_array_elements(coalesce(w.payload->'providers', '[]'::jsonb))
          with ordinality as existing(e, ordinality)
        union all
        select n as elem, 100000 + ordinality
        from jsonb_array_elements(${jsonSql(part)}::jsonb)
          with ordinality as incoming(n, ordinality)
        where n->>'id' not in (
          select e->>'id'
          from jsonb_array_elements(coalesce(w.payload->'providers', '[]'::jsonb)) as e
        )
      ) as combined
    )
  ),
  updated_at = now()
where w.id = '${WORKSPACE_ID}';
`,
    );
  }

  fs.writeFileSync(
    path.join(catalogDir, "z_apply.sql"),
    `-- Mark catalogue packs applied. Run after every sql/003/p*.sql batch.
-- Idempotent. Does not replace existing providers.

update public.navigator_workspace
set
  payload = payload
    || jsonb_build_object(
      'appliedPacks', (
        select to_jsonb(array_agg(distinct x))
        from unnest(
          coalesce(
            array(select jsonb_array_elements_text(coalesce(payload->'appliedPacks', '[]'::jsonb))),
            array[]::text[]
          ) || array['${NL_PACK_ID}', '${MINING_PACK_ID}']
        ) as x
      )
    )
    || case
      when coalesce(payload->>'sourceNote', '') like '%merged 19 September 2026%'
        then '{}'::jsonb
      else jsonb_build_object(
        'sourceNote', coalesce(payload->>'sourceNote', '') || '${CATALOG_MERGE_NOTE.replace(/'/g, "''")}'
      )
    end,
  updated_at = now()
where id = '${WORKSPACE_ID}';

notify pgrst, 'reload schema';
`,
  );

  fs.writeFileSync(
    path.join(catalogDir, "z_verify.sql"),
    `select
  jsonb_array_length(payload->'providers') as providers,
  (
    select count(*) from jsonb_array_elements(payload->'providers') p
    where p->>'origin' = 'nl-consumer-credit/1.0'
  ) as nl_credit,
  (
    select count(*) from jsonb_array_elements(payload->'providers') p
    where p->>'origin' = 'mining-solutions-europe/1.0'
  ) as mining,
  (
    select count(*) from jsonb_array_elements(payload->'providers') p
    where p->>'publicationStatus' = 'review_hold'
  ) as review_hold,
  (
    select count(*) from jsonb_array_elements(payload->'providers') p
    where p->>'publicationStatus' = 'legacy'
  ) as legacy,
  payload->'appliedPacks' as packs
from public.navigator_workspace
where id = '${WORKSPACE_ID}';
`,
  );

  fs.writeFileSync(
    path.join(root, "sql", "003_merge_catalog.sql"),
    `-- Create the Financial Navigator workspace row. Tiny on purpose.
-- The previous single-file version inlined ~760KB of JSON in one DO block and froze the Supabase SQL agent.
-- Directory records stay in navigator_workspace.payload. Do not create a providers table.
-- Do not alter navigator_comments or navigator_countries. Do not add anon RLS policies.
--
-- Run this file first, then sql/003/p01.sql through p${String(batchCount).padStart(2, "0")}.sql
-- in order (one file per Supabase agent turn), then sql/003/z_apply.sql and sql/003/z_verify.sql.
-- Never paste more than one batch file into the agent chat.

create table if not exists public.navigator_workspace (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.navigator_workspace enable row level security;

comment on table public.navigator_workspace is
  'Single-row JSON workspace for the Financial Navigator directory.';

insert into public.navigator_workspace (id, payload, updated_at)
values ('${WORKSPACE_ID}', ${jsonSql(skeleton)}::jsonb, now())
on conflict (id) do nothing;

notify pgrst, 'reload schema';
`,
  );
}

export { writeCatalogSql };

function isMain() {
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return invoked && path.normalize(invoked) === path.normalize(fileURLToPath(import.meta.url));
}

if (isMain()) {
const nlRecords = parseJsonRecords(readMarkdown(nlCandidates, "Netherlands consumer-credit"), 134, "NL");
const europeRecords = parseJsonRecords(readMarkdown(europeCandidates, "Nordics/Germany consumer-credit"), 210, "Nordics/DE");
const p2pRecords = parseJsonRecords(readMarkdown(p2pCandidates, "European P2P crypto"), 7, "P2P", 45);

const nlProviders = uniqueProviders(nlRecords.map((record) => mapCatalogRecord(record, "nl-consumer-credit/1.0")));
const europeProviders = uniqueProviders(europeRecords.map((record) => mapCatalogRecord(record, "europe-consumer-credit/1.0")));
const mining = miningProviders();
const p2p = uniqueProviders(p2pRecords.map(mapP2pRecord));
const htmlSeed = extractHtmlSeed();
const applied = [...new Set([
  ...(htmlSeed.appliedPacks || []),
  "high-street-banks-2026-09-18",
  "loans-credit-2026-09-18-v1",
  "cards-small-credit-2026-09-18-v1",
  NL_PACK_ID,
  EUROPE_PACK_ID,
  MINING_PACK_ID,
  P2P_PACK_ID,
])];

const mergedProviders = uniqueProviders([...(htmlSeed.providers || []), ...nlProviders, ...europeProviders, ...mining, ...p2p]);
const seed = {
  ...htmlSeed,
  sourceNote: [
    htmlSeed.sourceNote,
    "Netherlands consumer-credit catalogue mapped 19 September 2026 (nl-consumer-credit/1.0): 134 records. Review-hold and legacy/existing-only records are kept but excluded from new-offer results. Brokers and comparison platforms are Aggregators, not lenders.",
    "Finland, Sweden, Norway, Denmark and Germany consumer-credit catalogue mapped 19 September 2026 (europe-consumer-credit/1.0): 210 records. Amounts stay in EUR, SEK, NOK or DKK. hold_* records stay in the editorial queue. Brokers and comparison sites are Aggregators.",
    "Europe mining solutions added 19 September 2026 (GoMining, BitFuFu, Bitdeer, NiceHash). Country availability is Check until local terms are verified.",
    "European P2P crypto services added 19 September 2026 (finance-directory-p2p/1.0, 7 records). Claims are user-supplied and not independently verified. All seven stay on review_hold. Websites, amounts and ages were not invented.",
  ].filter(Boolean).join(" "),
  appliedPacks: applied,
  providers: mergedProviders,
};

fs.mkdirSync(path.join(root, "data", "packs"), { recursive: true });
fs.writeFileSync(path.join(root, "data", "packs", "nl-consumer-credit.json"), `${JSON.stringify({ packId: NL_PACK_ID, providers: nlProviders }, null, 2)}\n`);
fs.writeFileSync(path.join(root, "data", "packs", "nordics-germany-consumer-credit.json"), `${JSON.stringify({ packId: EUROPE_PACK_ID, providers: europeProviders }, null, 2)}\n`);
fs.writeFileSync(path.join(root, "data", "packs", "mining-solutions.json"), `${JSON.stringify({ packId: MINING_PACK_ID, providers: mining }, null, 2)}\n`);
fs.writeFileSync(path.join(root, "data", "packs", "europe-p2p-crypto.json"), `${JSON.stringify({ packId: P2P_PACK_ID, providers: p2p }, null, 2)}\n`);
fs.writeFileSync(path.join(root, "data", "seed.json"), `${JSON.stringify(seed)}\n`);

const counts = {
  html: (htmlSeed.providers || []).length,
  nl: nlProviders.length,
  europe: europeProviders.length,
  mining: mining.length,
  p2p: p2p.length,
  p2pHold: p2p.filter((item) => item.publicationStatus === "review_hold").length,
  merged: mergedProviders.length,
  reviewHold: [...nlProviders, ...europeProviders, ...p2p].filter((item) => item.publicationStatus === "review_hold").length,
  europeHold: europeProviders.filter((item) => item.publicationStatus === "review_hold").map((item) => item.id),
  aggregators: europeProviders.filter((item) => item.category === "Aggregators").length,
  loans: europeProviders.filter((item) => item.category === "Loans & credit").length,
  currencies: [...new Set(europeProviders.map((item) => item.lending?.currency).filter(Boolean))],
};
console.log(JSON.stringify(counts, null, 2));
}
