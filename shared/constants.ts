export const COUNTRIES = [
  "Netherlands",
  "Germany",
  "Denmark",
  "Finland",
  "Norway",
  "Sweden",
] as const;

export const CODES = {
  Netherlands: "NL",
  Germany: "DE",
  Denmark: "DK",
  Finland: "FI",
  Norway: "NO",
  Sweden: "SE",
} as const;

export const COUNTRY_SLUGS = {
  Netherlands: "netherlands",
  Germany: "germany",
  Denmark: "denmark",
  Finland: "finland",
  Norway: "norway",
  Sweden: "sweden",
} as const;

export const SLUG_TO_COUNTRY = {
  netherlands: "Netherlands",
  germany: "Germany",
  denmark: "Denmark",
  finland: "Finland",
  norway: "Norway",
  sweden: "Sweden",
} as const;

export const CATEGORY_INFO = [
  { name: "Loans & credit", label: "Loans & credit", icon: "wallet", note: "Local borrowing products" },
  { name: "High-street banks", label: "High-street banks", icon: "bank", note: "Local retail banks & networks" },
  { name: "Mining Solutions", label: "Mining solutions", icon: "pickaxe", note: "BTC hashrate & withdrawals" },
  { name: "Ramps", label: "Crypto ramps", icon: "ramp", note: "Purchase limits & routes" },
  { name: "Exchanges", label: "Exchanges", icon: "exchange", note: "Crypto accounts & apps" },
  { name: "P2P", label: "P2P services", icon: "users", note: "Peer-to-peer services" },
  { name: "Banks / payments", label: "Neobanks & payments", icon: "wallet", note: "Neobanks & payment apps" },
  { name: "Brokers", label: "Investing brokers", icon: "chart", note: "Investment platforms" },
  { name: "Aggregators", label: "Compare & arrange", icon: "layers", note: "Brokers, not lenders" },
] as const;

export const CATEGORIES = CATEGORY_INFO.map((c) => c.name);
export const STATUSES = ["Listed", "Check", "Limited", "Restricted"] as const;
export const UPPER_STATUSES = [
  "Not verified",
  "Not stated in source",
  "Published cap",
  "Product-specific",
  "No cap (explicit)",
] as const;
export const AGE_EVIDENCE = [
  "Not verified",
  "Verified",
  "Product-specific",
  "Legal-capacity rule",
  "Provider-dependent",
  "User-entered",
] as const;
export const LOAN_TYPES = [
  "Personal loan",
  "Credit card",
  "Home-secured / equity release",
  "Overdraft / credit line",
  "Debt consolidation",
  "Card instalments",
  "BNPL / pay later",
  "Device / hire purchase",
  "Car finance",
  "Private lease (adjacent)",
  "Revolving / retail credit",
  "Senior loan",
  "Bridging loan",
  "Public / municipal scheme",
  "Student / education loan",
  "Social / pawn credit",
  "Securities-secured credit",
  "Other secured / private",
  "Short-term miniloan",
] as const;
export const LOAN_SECURITY = [
  "Unsecured",
  "Home-secured",
  "Home / other assets",
  "Vehicle / retained title",
  "Pledge / other assets",
  "Lender-dependent",
] as const;
export const LOAN_SPEED = ["Standard / not verified", "Quick initial decision", "Fast after approval"] as const;
export const LOAN_GROUPS = [
  { id: "cards_overdrafts", types: ["Credit card", "Overdraft / credit line"] },
  { id: "personal_senior", types: ["Personal loan", "Senior loan", "Debt consolidation", "Short-term miniloan"] },
  { id: "shopping_bnpl", types: ["BNPL / pay later", "Device / hire purchase", "Card instalments", "Revolving / retail credit"] },
  { id: "car_finance", types: ["Car finance", "Private lease (adjacent)"] },
  { id: "mortgages", types: ["Home-secured / equity release", "Bridging loan"] },
  { id: "retirement", types: ["Senior loan"] },
  { id: "public_student", types: ["Public / municipal scheme", "Student / education loan", "Social / pawn credit"] },
] as const;
export const AUDIENCE_FILTERS = ["small", "senior", "homeowner", "self_employed"] as const;
export const PUBLICATION_STATUSES = ["publish", "review_hold", "legacy"] as const;
export const WITHDRAWAL_SPEEDS = ["instant_fast", "daily_threshold", "pool_threshold", "contract_based"] as const;
export const WITHDRAWAL_RATINGS = ["GREEN", "GREEN_YELLOW", "YELLOW", "RED"] as const;
export const LOAN_TEXT_KEYS = [
  "lender",
  "type",
  "minimum",
  "minimumBasis",
  "currency",
  "channel",
  "decision",
  "payout",
  "speed",
  "security",
  "eligibility",
  "payoffAge",
  "retirement",
  "costs",
  "term",
  "repayment",
] as const;
export const MINING_TEXT_KEYS = [
  "productType",
  "rewards",
  "kyc",
  "instantWithdrawal",
  "payoutMethod",
  "withdrawalRules",
  "holdingRestrictions",
  "bestFor",
] as const;

export const PAGE_SIZE = 12;
export const CARD_PACK_ID = "cards-small-credit-2026-09-18-v1";
export const BANK_PACK_ID = "high-street-banks-2026-09-18";
export const LOAN_PACK_ID = "loans-credit-2026-09-18-v1";
export const NL_CREDIT_PACK_ID = "nl-consumer-credit-2026-09-19-v1";
export const EUROPE_CREDIT_PACK_ID = "nordics-germany-consumer-credit-2026-09-19-v1";
export const MINING_PACK_ID = "mining-solutions-europe-2026-09-19-v1";
export const CARD_PACK_IDS = [
  "credit-se-remember-flex",
  "credit-no-remember-black",
  "credit-no-remember-gold",
  "credit-de-tf-mastercard-gold",
  "credit-nl-ics-visa-world-card",
  "credit-nl-rabo-kort-roodstaan",
  "credit-de-cashper-minikredit",
  "credit-fi-s-pankki-visa-credit",
  "credit-se-northmill-kontokredit",
  "credit-dk-ferratum-kredit",
] as const;

export const LOCALES = ["en", "nl", "de"] as const;
export const DEFAULT_LOCALE = "en";
export const ADMIN_PIN_LENGTH = 4;
export const WORKSPACE_ID = "nl-de-nordics-2026-v1";
export const FAVORITES_KEY = `financial-navigator-v1:${WORKSPACE_ID}:favorites`;
export const VIEW_KEY = `financial-navigator-v1:${WORKSPACE_ID}:view`;
export const COMMENT_NAME_KEY = `financial-navigator-v1:${WORKSPACE_ID}:comment-name`;
