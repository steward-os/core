export const TRANSACTION_TYPE_LABELS = {
  BANK_IMPORT: "Bank afschrift",
  CASH_MUTATION: "Kasboeking",
  INVOICE_OUT: "Verkoopfactuur",
  INVOICE_IN: "Inkoopfactuur",
  MEMORIAL: "Memoriaal",
  YEAR_CLOSING: "Jaarafsluiting",
  YEAR_OPENING: "Openingsbalans",
  INVOICE_CREDIT: "Creditnota",
  SEPA_BATCH: "Incasso Batch",
};

export const LEDGER_CATEGORY_LABELS = {
  ASSETS: "Activa",
  LIABILITIES: "Passiva",
  EQUITY: "Eigen vermogen",
  REVENUE: "Baten",
  EXPENSES: "Lasten",
};

export const BANK_STATEMENT_STATUS_LABELS = {
  PENDING: "In afwachting",
  PROCESSED: "Verwerkt",
  ERROR: "Fout",
};

export const CATEGORY_OPTIONS = [
  { value: "", label: "Selecteer categorie" },
  ...Object.entries(LEDGER_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

export const LEDGER_SUB_CATEGORY_LABELS = {
  // ASSETS
  ASSETS_FIXED: "Vaste activa",
  ASSETS_FINANCIAL: "Financiële vaste activa",
  ASSETS_CURRENT: "Vlottende activa",
  // LIABILITIES
  LIABILITIES_SHORT: "Kortlopende schulden",
  LIABILITIES_LONG: "Langlopende schulden",
  // EQUITY
  EQUITY_RESERVES: "Reserves",
  EQUITY_RESULT: "Resultaat",
  // REVENUE
  REVENUE_CONTRIBUTIONS: "Contributies",
  REVENUE_SUBSIDIES: "Subsidies & sponsoring",
  REVENUE_ACTIVITIES: "Activiteiten & optredens",
  // EXPENSES
  EXPENSES_PERSONNEL: "Personeel & instructie",
  EXPENSES_ACTIVITIES: "Activiteiten",
  EXPENSES_ASSETS: "Instrumenten & uniformen",
  EXPENSES_GENERAL: "Algemene kosten",
};

export const SUB_CATEGORY_OPTIONS_BY_CATEGORY = {
  ASSETS: [
    { value: "ASSETS_FIXED", label: "Vaste activa" },
    { value: "ASSETS_FINANCIAL", label: "Financiële vaste activa" },
    { value: "ASSETS_CURRENT", label: "Vlottende activa" },
  ],
  LIABILITIES: [
    { value: "LIABILITIES_SHORT", label: "Kortlopende schulden" },
    { value: "LIABILITIES_LONG", label: "Langlopende schulden" },
  ],
  EQUITY: [
    { value: "EQUITY_RESERVES", label: "Reserves" },
    { value: "EQUITY_RESULT", label: "Resultaat" },
  ],
  REVENUE: [
    { value: "REVENUE_CONTRIBUTIONS", label: "Contributies" },
    { value: "REVENUE_SUBSIDIES", label: "Subsidies & sponsoring" },
    { value: "REVENUE_ACTIVITIES", label: "Activiteiten & optredens" },
  ],
  EXPENSES: [
    { value: "EXPENSES_PERSONNEL", label: "Personeel & instructie" },
    { value: "EXPENSES_ACTIVITIES", label: "Activiteiten" },
    { value: "EXPENSES_ASSETS", label: "Instrumenten & uniformen" },
    { value: "EXPENSES_GENERAL", label: "Algemene kosten" },
  ],
};
