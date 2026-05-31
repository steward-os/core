import { getFiscalYear } from "./fiscalYearService";
import { getAllLedgerAccounts } from "./ledgerAccountService";
import { getAllJournalEntries } from "./journalTransactionService";

/**
 * Computes opening balances per account from all entries before the fiscal year start.
 * Returns an array of { account_number, amount, side } where side is 'D' or 'C'.
 */
function computeOpeningBalances(entries) {
  const balances = {}; // account_number -> { debit, credit }

  for (const entry of entries) {
    const accNumber = entry.expand?.ledger_account?.account_number;
    if (!accNumber) continue;

    if (!balances[accNumber]) balances[accNumber] = { debit: 0, credit: 0 };
    balances[accNumber].debit += Number(entry.debit || 0);
    balances[accNumber].credit += Number(entry.credit || 0);
  }

  return Object.entries(balances)
    .map(([account_number, { debit, credit }]) => {
      const net = debit - credit;
      if (net === 0) return null;
      return { account_number, amount: Math.abs(net), side: net > 0 ? "D" : "C" };
    })
    .filter(Boolean)
    .sort((a, b) => a.account_number.localeCompare(b.account_number));
}

/**
 * Groups journal entries by their transaction and returns structured transactions.
 * Each transaction includes its entries with ledger_account data expanded.
 */
function groupEntriesByTransaction(entries) {
  const txMap = {}; // transaction id -> transaction record

  for (const entry of entries) {
    const tx = entry.expand?.journal_transaction;
    if (!tx) continue;

    if (!txMap[tx.id]) {
      txMap[tx.id] = { ...tx, entries: [] };
    }
    txMap[tx.id].entries.push(entry);
  }

  return Object.values(txMap).sort((a, b) => {
    const dateCompare = (a.transaction_date || "").localeCompare(b.transaction_date || "");
    if (dateCompare !== 0) return dateCompare;
    return (a.entry_number || "").localeCompare(b.entry_number || "");
  });
}

/**
 * Fetches all data required to generate an XAF file for the given fiscal year.
 *
 * @param {string} fiscalYearId - PocketBase ID of the fiscal year to export
 * @returns {{ fiscalYear, ledgerAccounts, transactions, openingBalances }}
 */
export async function fetchXAFData(fiscalYearId) {
  const [fiscalYear, ledgerAccounts] = await Promise.all([
    getFiscalYear(fiscalYearId, { requestKey: `xaf-fy-${fiscalYearId}` }),
    getAllLedgerAccounts({ sort: "account_number", requestKey: `xaf-accounts-${fiscalYearId}` }),
  ]);

  const startDate = fiscalYear.start_date?.slice(0, 10);

  const [periodEntries, openingEntries] = await Promise.all([
    getAllJournalEntries({
      filter: `journal_transaction.fiscal_year = "${fiscalYearId}"`,
      expand: "journal_transaction,ledger_account",
      sort: "journal_transaction.transaction_date,journal_transaction.entry_number",
      requestKey: `xaf-period-${fiscalYearId}`,
    }),
    getAllJournalEntries({
      filter: `journal_transaction.transaction_date < "${startDate}"`,
      expand: "ledger_account",
      requestKey: `xaf-opening-${fiscalYearId}`,
    }),
  ]);

  const transactions = groupEntriesByTransaction(periodEntries);
  const openingBalances = computeOpeningBalances(openingEntries);

  return { fiscalYear, ledgerAccounts, transactions, openingBalances };
}
