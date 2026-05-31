/**
 * XAF (XML Auditfile Financial) v3.2 Generator
 * Dutch standard for financial data export (Belastingdienst)
 */

function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe).replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "\"": return "&quot;";
      case "'": return "&apos;";
      default: return c;
    }
  });
}

function formatAmount(value) {
  return Math.abs(Number(value) || 0).toFixed(2);
}

// Maps our account categories to XAF account types
const ACCOUNT_TYPE_MAP = {
  ASSETS: "B",
  LIABILITIES: "B",
  EQUITY: "B",
  REVENUE: "P",
  EXPENSES: "P",
};

// Maps our transaction types to XAF journal definitions
const JOURNAL_MAP = {
  BANK_IMPORT:    { id: "BANK", desc: "Bank afschriften",  type: "Z" },
  CASH_MUTATION:  { id: "KAS",  desc: "Kasboek",           type: "C" },
  INVOICE_OUT:    { id: "VRK",  desc: "Verkoopfacturen",   type: "S" },
  INVOICE_IN:     { id: "INK",  desc: "Inkoopfacturen",    type: "P" },
  MEMORIAL:       { id: "MEM",  desc: "Memoriaal",         type: "Z" },
  YEAR_CLOSING:   { id: "AFSL", desc: "Jaarafsluiting",    type: "Z" },
};

/**
 * Determines the period number (1–12) for a given date within a fiscal year.
 * Periods are calendar months within the fiscal year ordered by start_date.
 */
function getPeriodNumber(dateStr, fiscalYearStart) {
  const date = new Date(dateStr);
  const start = new Date(fiscalYearStart);
  const months = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
  return Math.max(1, Math.min(12, months + 1));
}

/**
 * Generates monthly periods spanning the fiscal year.
 * Returns up to 12 periods starting at fiscal year start_date.
 */
function generatePeriods(startDate, endDate) {
  const MONTH_NAMES = [
    "Januari", "Februari", "Maart", "April", "Mei", "Juni",
    "Juli", "Augustus", "September", "Oktober", "November", "December",
  ];

  const periods = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  let periodNumber = 1;

  while (current <= end && periodNumber <= 12) {
    const periodStart = new Date(current);
    const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const clampedEnd = periodEnd > end ? end : periodEnd;

    periods.push({
      number: periodNumber,
      desc: MONTH_NAMES[current.getMonth()],
      startDate: periodStart.toISOString().slice(0, 10),
      endDate: clampedEnd.toISOString().slice(0, 10),
    });

    current.setMonth(current.getMonth() + 1);
    periodNumber++;
  }

  return periods;
}

/**
 * Generates an XAF 3.2 XML string for a fiscal year.
 *
 * @param {Object} fiscalYear - { year_name, start_date, end_date }
 * @param {Array}  ledgerAccounts - [{ account_number, name, category }]
 * @param {Array}  transactions - [{ entry_number, transaction_date, description, transaction_type, entries: [{ expand: { ledger_account: {account_number} }, debit, credit }] }]
 * @param {Array}  openingBalances - [{ account_number, amount, side }] side = 'D' | 'C'
 * @returns {string} XAF XML string
 */
export function generateXAF({ fiscalYear, ledgerAccounts, transactions, openingBalances }) {
  const today = new Date().toISOString().slice(0, 10);
  const periods = generatePeriods(fiscalYear.start_date, fiscalYear.end_date);

  // --- Chart of accounts ---
  const ledgerXml = ledgerAccounts.map((acc) => {
    const accTp = ACCOUNT_TYPE_MAP[acc.category] || "B";
    return `        <ledgerAccount>
          <accID>${escapeXml(acc.account_number)}</accID>
          <accDesc>${escapeXml(acc.name)}</accDesc>
          <accTp>${accTp}</accTp>
        </ledgerAccount>`;
  }).join("\n");

  // --- Periods ---
  const periodsXml = periods.map((p) => `      <period>
        <periodNumber>${p.number}</periodNumber>
        <periodDesc>${escapeXml(p.desc)}</periodDesc>
        <startDatePeriod>${p.startDate}</startDatePeriod>
        <endDatePeriod>${p.endDate}</endDatePeriod>
      </period>`).join("\n");

  // --- Opening balance ---
  const obTotalDebit = openingBalances
    .filter((b) => b.side === "D")
    .reduce((s, b) => s + Number(b.amount), 0);
  const obTotalCredit = openingBalances
    .filter((b) => b.side === "C")
    .reduce((s, b) => s + Number(b.amount), 0);

  const obLinesXml = openingBalances.map((b, i) => `      <obLine>
        <nr>${i + 1}</nr>
        <accID>${escapeXml(b.account_number)}</accID>
        <amnt>${formatAmount(b.amount)}</amnt>
        <amntDc>${b.side}</amntDc>
      </obLine>`).join("\n");

  const openingBalanceXml = `    <openingBalance>
      <opBalDate>${escapeXml(fiscalYear.start_date?.slice(0, 10))}</opBalDate>
      <linesCount>${openingBalances.length}</linesCount>
      <totalDebit>${obTotalDebit.toFixed(2)}</totalDebit>
      <totalCredit>${obTotalCredit.toFixed(2)}</totalCredit>
${obLinesXml}
    </openingBalance>`;

  // --- Transactions grouped by journal type ---
  const journalGroups = {};
  for (const tx of transactions) {
    const type = tx.transaction_type || "MEMORIAL";
    if (!journalGroups[type]) journalGroups[type] = [];
    journalGroups[type].push(tx);
  }

  let txTotalDebit = 0;
  let txTotalCredit = 0;
  let txLinesCount = 0;

  const journalsXml = Object.entries(journalGroups).map(([type, txList]) => {
    const journal = JOURNAL_MAP[type] || { id: type, desc: type, type: "Z" };

    const transactionsXml = txList.map((tx) => {
      const txDate = tx.transaction_date?.slice(0, 10) || today;
      const periodNum = getPeriodNumber(txDate, fiscalYear.start_date);
      const txAmount = tx.entries.reduce((s, e) => s + Number(e.debit || 0), 0);

      const linesXml = tx.entries.map((entry, i) => {
        const accNumber = entry.expand?.ledger_account?.account_number || "";
        const isDebit = Number(entry.debit || 0) > 0;
        const amount = isDebit ? Number(entry.debit) : Number(entry.credit);
        const side = isDebit ? "D" : "C";

        if (isDebit) txTotalDebit += amount;
        else txTotalCredit += amount;
        txLinesCount++;

        return `          <trLine>
            <nr>${i + 1}</nr>
            <accID>${escapeXml(accNumber)}</accID>
            <docRef>${escapeXml(tx.entry_number)}</docRef>
            <effDate>${txDate}</effDate>
            <desc>${escapeXml(tx.description)}</desc>
            <amnt>${formatAmount(amount)}</amnt>
            <amntDc>${side}</amntDc>
          </trLine>`;
      }).join("\n");

      return `        <transaction>
          <nr>${escapeXml(tx.entry_number)}</nr>
          <desc>${escapeXml(tx.description)}</desc>
          <periodNumber>${periodNum}</periodNumber>
          <trDt>${txDate}</trDt>
          <amnt>${txAmount.toFixed(2)}</amnt>
${linesXml}
        </transaction>`;
    }).join("\n");

    return `      <journal>
        <jrnID>${escapeXml(journal.id)}</jrnID>
        <desc>${escapeXml(journal.desc)}</desc>
        <jrnTp>${journal.type}</jrnTp>
${transactionsXml}
      </journal>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<auditfile xmlns="http://www.auditfiles.nl/XAF/3.2">
  <header>
    <fiscalYear>${escapeXml(fiscalYear.year_name)}</fiscalYear>
    <startDate>${escapeXml(fiscalYear.start_date?.slice(0, 10))}</startDate>
    <endDate>${escapeXml(fiscalYear.end_date?.slice(0, 10))}</endDate>
    <curCode>EUR</curCode>
    <dateCreated>${today}</dateCreated>
    <softwareDesc>Fanfare Tools</softwareDesc>
    <softwareVersion>1.0</softwareVersion>
    <softwareCompanyName>Fanfare Tools</softwareCompanyName>
    <taxRegistrationCountry>NL</taxRegistrationCountry>
    <productVersion>3.2</productVersion>
  </header>
  <company>
    <companyIdent></companyIdent>
    <companyName></companyName>
    <taxRegistrationCountry>NL</taxRegistrationCountry>
    <generalLedger>
${ledgerXml}
    </generalLedger>
    <periods>
${periodsXml}
    </periods>
${openingBalanceXml}
    <transactions>
      <linesCount>${txLinesCount}</linesCount>
      <totalDebit>${txTotalDebit.toFixed(2)}</totalDebit>
      <totalCredit>${txTotalCredit.toFixed(2)}</totalCredit>
${journalsXml}
    </transactions>
  </company>
</auditfile>`;

  return xml;
}
