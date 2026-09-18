import type {
  AGE_EVIDENCE,
  CATEGORIES,
  COUNTRIES,
  LOCALES,
  LOAN_SECURITY,
  LOAN_SPEED,
  LOAN_TYPES,
  STATUSES,
  UPPER_STATUSES,
} from "./constants.ts";

export type Country = (typeof COUNTRIES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
export type UpperStatus = (typeof UPPER_STATUSES)[number];
export type AgeEvidence = (typeof AGE_EVIDENCE)[number];
export type LoanType = (typeof LOAN_TYPES)[number];
export type LoanSecurity = (typeof LOAN_SECURITY)[number];
export type LoanSpeed = (typeof LOAN_SPEED)[number];
export type Locale = (typeof LOCALES)[number];

export interface CountryEntry {
  status: Status;
  note: string;
  age?: string;
  url?: string;
}

export interface Lending {
  lender: string;
  type: LoanType;
  minimum: string;
  minimumBasis: string;
  currency: string;
  channel: string;
  decision: string;
  payout: string;
  speed: LoanSpeed;
  security: LoanSecurity;
  eligibility: string;
  payoffAge: string;
  retirement: string;
  costs: string;
  term: string;
  repayment: string;
  minimumValue: number | null;
  smallCredit: boolean;
}

export interface Provider {
  id: string;
  name: string;
  category: Category;
  website: string;
  service: string;
  countryFocus: string;
  countries: Partial<Record<Country, CountryEntry>>;
  limitations: string;
  ageEligibility: string;
  ageEvidence: AgeEvidence;
  ageNotes: string;
  upperAge: string;
  upperAgeStatus: UpperStatus;
  sources: { age: string[]; service: string[] };
  reviewNote: string;
  sourceDate: string;
  origin: string;
  notes: string;
  updatedAt: string;
  minPayment?: string;
  maxPayment?: string;
  lending?: Lending;
  deletedAt?: string;
}

export interface Workspace {
  schemaVersion: 1;
  app: "Financial Navigator";
  workspaceId: string;
  sourceFile: string;
  sourceNote: string;
  countries: Country[];
  appliedPacks: string[];
  providers: Provider[];
  trash: Provider[];
  favorites: string[];
  lastSaved: string | null;
  revision: number;
}

export type ViewMode = "directory" | "favorites" | "trash";
export type ViewLayout = "grid" | "list";
export type SortKey = "az" | "za" | "updated";
export type LoanMinimumFilter = "all" | "published" | "small" | "new";

export interface DirectoryView {
  mode: ViewMode;
  country: "all" | Country;
  category: "all" | Category;
  query: string;
  status: "all" | Status;
  upper: "all" | UpperStatus;
  sort: SortKey;
  layout: ViewLayout;
  page: number;
  loanType: "all" | LoanType;
  loanSecurity: "all" | LoanSecurity;
  loanSpeed: "all" | LoanSpeed;
  loanMinimum: LoanMinimumFilter;
}

export const DEFAULT_VIEW: DirectoryView = {
  mode: "directory",
  country: "all",
  category: "Loans & credit",
  query: "",
  status: "all",
  upper: "all",
  sort: "az",
  layout: "grid",
  page: 1,
  loanType: "all",
  loanSecurity: "all",
  loanSpeed: "all",
  loanMinimum: "all",
};

export interface EntryComment {
  id: string;
  entry_slug: string;
  country_slug: string | null;
  author_name: string;
  body: string;
  created_at: string;
}

export interface PublicWorkspace {
  schemaVersion: 1;
  app: "Financial Navigator";
  workspaceId: string;
  sourceFile: string;
  sourceNote: string;
  countries: Country[];
  providers: Provider[];
  trash: Provider[];
  lastSaved: string | null;
  revision: number;
}
