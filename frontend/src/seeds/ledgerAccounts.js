export const LEDGER_ACCOUNT_SEEDS = [
  // --- BALANS: ACTIVA (Bezit) ---
  { account_number: "0200", name: "Instrumentarium", category: "ASSETS", sub_category: "ASSETS_FIXED" },
  { account_number: "0900", name: "Lening u/g Beheerstichting", category: "ASSETS", sub_category: "ASSETS_FINANCIAL" },
  { account_number: "1000", name: "Bank / Kas", category: "ASSETS", sub_category: "ASSETS_CURRENT", is_bank_account: true },
  { account_number: "1100", name: "Incasso onderweg", category: "ASSETS", sub_category: "ASSETS_CURRENT", is_suspense_account: true },
  { account_number: "1300", name: "Debiteuren", category: "ASSETS", sub_category: "ASSETS_CURRENT" },
  { account_number: "1401", name: "Vooruitbetaald: Dirigent A", category: "ASSETS", sub_category: "ASSETS_CURRENT" },
  { account_number: "1402", name: "Vooruitbetaald: Dirigent B", category: "ASSETS", sub_category: "ASSETS_CURRENT" },

  // --- BALANS: EIGEN VERMOGEN ---
  { account_number: "0500", name: "Algemene Reserve", category: "EQUITY", sub_category: "EQUITY_RESERVES" },
  { account_number: "0510", name: "Bestemmingsreserve Uniformen", category: "EQUITY", sub_category: "EQUITY_RESERVES" },
  { account_number: "0550", name: "Resultaat lopend boekjaar", category: "EQUITY", sub_category: "EQUITY_RESULT" },

  // --- BALANS: PASSIVA (Schulden) ---
  { account_number: "1600", name: "Crediteuren", category: "LIABILITIES", sub_category: "LIABILITIES_SHORT" },
  {
    account_number: "1850",
    name: "Vooruitontvangen contributie",
    category: "LIABILITIES",
    sub_category: "LIABILITIES_SHORT",
  },

  // --- WINST & VERLIES: BATEN (Inkomsten) ---
  { account_number: "8000", name: "Contributies", category: "REVENUE", sub_category: "REVENUE_CONTRIBUTIONS" },
  {
    account_number: "8100",
    name: "Eigen bijdrage Lesgeld",
    category: "REVENUE",
    sub_category: "REVENUE_CONTRIBUTIONS",
  },
  { account_number: "8200", name: "Subsidies & Sponsoring", category: "REVENUE", sub_category: "REVENUE_SUBSIDIES" },
  {
    account_number: "8250",
    name: "Vrijwilligerswerk / Acties",
    category: "REVENUE",
    sub_category: "REVENUE_ACTIVITIES",
  },
  { account_number: "8300", name: "Optredens & Concerten", category: "REVENUE", sub_category: "REVENUE_ACTIVITIES" },

  // --- WINST & VERLIES: LASTEN (Uitgaven) ---
  { account_number: "4000", name: "Kosten Dirigent", category: "EXPENSES", sub_category: "EXPENSES_PERSONNEL" },
  { account_number: "4010", name: "Kosten Instructeur", category: "EXPENSES", sub_category: "EXPENSES_PERSONNEL" },
  {
    account_number: "4100",
    name: "Aanschaf en onderhoud uniformen",
    category: "EXPENSES",
    sub_category: "EXPENSES_ASSETS",
  },
  {
    account_number: "4150",
    name: "Onderhoud & Verzekering instrumenten",
    category: "EXPENSES",
    sub_category: "EXPENSES_ASSETS",
  },
  { account_number: "4400", name: "Afschrijving Instrumenten", category: "EXPENSES", sub_category: "EXPENSES_ASSETS" },
  { account_number: "4500", name: "Lesgeld / Opleidingen", category: "EXPENSES", sub_category: "EXPENSES_PERSONNEL" },
  { account_number: "4700", name: "Activiteitencommissie", category: "EXPENSES", sub_category: "EXPENSES_ACTIVITIES" },
  { account_number: "4710", name: "Concertkosten", category: "EXPENSES", sub_category: "EXPENSES_ACTIVITIES" },
  { account_number: "4720", name: "Aanschaf bladmuziek", category: "EXPENSES", sub_category: "EXPENSES_ACTIVITIES" },
  { account_number: "4800", name: "Huisvesting / Zaalhuur", category: "EXPENSES", sub_category: "EXPENSES_GENERAL" },
  {
    account_number: "4900",
    name: "Algemene kosten (bestuur/admin)",
    category: "EXPENSES",
    sub_category: "EXPENSES_GENERAL",
  },
];
