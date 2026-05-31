import { getAllJournalTransactions, getAllJournalEntries, createJournalTransaction, createJournalEntry, deleteJournalEntry, deleteJournalTransaction } from "./journalTransactionService";
import { createFiscalYear, deleteFiscalYear, getFiscalYear, getFiscalYearForDate, updateFiscalYear } from "./fiscalYearService";
import { getAllBankStatementLines, deleteBankStatementLine } from "./bankStatementService";
import dayjs from "dayjs";

/**
 * Compute a preview of the closing entries for a fiscal year.
 * Returns lines for revenue (baten) and expense (lasten) accounts,
 * the net result, and whether a next fiscal year exists for opening entries.
 */
export async function computeClosingPreview(fiscalYearId) {
  const [entries, currentFY] = await Promise.all([
    getAllJournalEntries({
      filter: `journal_transaction.fiscal_year = "${fiscalYearId}" && journal_transaction.is_closing = false`,
      expand: "ledger_account",
    }),
    getFiscalYear(fiscalYearId),
  ]);

  const nextDayDate = dayjs(currentFY.end_date).add(1, "day").format("YYYY-MM-DD");
  const nextFY = await getFiscalYearForDate(nextDayDate);

  // Group entries by ledger account, summing debit and credit
  const accountMap = {};
  for (const entry of entries) {
    const account = entry.expand?.ledger_account;
    if (!account) continue;
    const category = account.category;
    if (category !== "REVENUE" && category !== "EXPENSES") continue;

    if (!accountMap[account.id]) {
      accountMap[account.id] = {
        accountId: account.id,
        accountName: account.name,
        accountNumber: account.account_number,
        category,
        totalDebit: 0,
        totalCredit: 0,
      };
    }
    accountMap[account.id].totalDebit += entry.debit || 0;
    accountMap[account.id].totalCredit += entry.credit || 0;
  }

  const lines = [];
  let totalBaten = 0;
  let totalLasten = 0;

  for (const acc of Object.values(accountMap)) {
    if (acc.category === "REVENUE") {
      // Net credit balance → closing entry debits this account
      const netBalance = acc.totalCredit - acc.totalDebit;
      if (Math.abs(netBalance) > 0.004) {
        lines.push({ ...acc, closingDebit: netBalance, closingCredit: 0 });
        totalBaten += netBalance;
      }
    } else if (acc.category === "EXPENSES") {
      // Net debit balance → closing entry credits this account
      const netBalance = acc.totalDebit - acc.totalCredit;
      if (Math.abs(netBalance) > 0.004) {
        lines.push({ ...acc, closingDebit: 0, closingCredit: netBalance });
        totalLasten += netBalance;
      }
    }
  }

  const netResult = totalBaten - totalLasten;

  return { lines, netResult, totalBaten, totalLasten, nextFiscalYear: nextFY ?? null };
}

/**
 * Close a fiscal year:
 * 1. Build closing entries from baten/lasten account balances
 * 2. Create a closing journal transaction
 * 3. Book all closing entries + equity entry
 * 4. Lock the fiscal year
 */
export async function closeYear(fiscalYearId, equityAccountId) {
  const { lines, netResult } = await computeClosingPreview(fiscalYearId);

  // Create the closing transaction
  const transaction = await createJournalTransaction({
    fiscal_year: fiscalYearId,
    description: "Jaarafsluiting",
    transaction_type: "YEAR_CLOSING",
    is_closing: true,
    transaction_date: dayjs().format("YYYY-MM-DD"),
  });

  // Create closing entries for each revenue/expense account
  for (const line of lines) {
    await createJournalEntry({
      journal_transaction: transaction.id,
      ledger_account: line.accountId,
      debit: line.closingDebit,
      credit: line.closingCredit,
    });
  }

  // Book net result to equity account
  // Profit → credit equity; Loss → debit equity
  if (Math.abs(netResult) > 0.004) {
    await createJournalEntry({
      journal_transaction: transaction.id,
      ledger_account: equityAccountId,
      debit: netResult < 0 ? Math.abs(netResult) : 0,
      credit: netResult > 0 ? netResult : 0,
    });
  }

  // Create opening entries in the next fiscal year for balance sheet accounts
  await createOpeningEntries(fiscalYearId);

  // Lock the fiscal year
  await updateFiscalYear(fiscalYearId, { is_locked: true });

  return transaction;
}

/**
 * Compute closing balances for ASSETS/LIABILITIES/EQUITY accounts (all entries
 * including the closing transaction we just created) and post them as opening
 * entries in the next fiscal year.
 */
function deriveNextYearName(currentName) {
  const rangeMatch = currentName.match(/^(\d{4})-(\d{4})$/);
  if (rangeMatch) return `${+rangeMatch[1] + 1}-${+rangeMatch[2] + 1}`;
  const yearMatch = currentName.match(/^(\d{4})$/);
  if (yearMatch) return `${+yearMatch[1] + 1}`;
  return `${currentName} (volgend)`;
}

async function createOpeningEntries(fiscalYearId) {
  // Find (or create) the next fiscal year
  const currentFY = await getFiscalYear(fiscalYearId);
  const nextStartDate = dayjs(currentFY.end_date).add(1, "day").format("YYYY-MM-DD");
  let nextFY = await getFiscalYearForDate(nextStartDate);

  if (!nextFY) {
    nextFY = await createFiscalYear({
      year_name: deriveNextYearName(currentFY.year_name),
      start_date: nextStartDate,
      end_date: dayjs(currentFY.end_date).add(1, "year").format("YYYY-MM-DD"),
      is_locked: false,
    });
  }

  // Fetch all journal entries for the current year (including closing entries)
  const entries = await getAllJournalEntries({
    filter: `journal_transaction.fiscal_year = "${fiscalYearId}"`,
    expand: "ledger_account",
  });

  // Sum debits/credits per balance-sheet account
  const balanceMap = {};
  for (const entry of entries) {
    const account = entry.expand?.ledger_account;
    if (!account) continue;
    const { category } = account;
    if (category !== "ASSETS" && category !== "LIABILITIES" && category !== "EQUITY") continue;

    if (!balanceMap[account.id]) {
      balanceMap[account.id] = { accountId: account.id, totalDebit: 0, totalCredit: 0 };
    }
    balanceMap[account.id].totalDebit += entry.debit || 0;
    balanceMap[account.id].totalCredit += entry.credit || 0;
  }

  const openingLines = Object.values(balanceMap).filter(
    (acc) => Math.abs(acc.totalDebit - acc.totalCredit) > 0.004
  );
  if (openingLines.length === 0) return;

  const openingTransaction = await createJournalTransaction({
    fiscal_year: nextFY.id,
    description: "Openingsbalans",
    transaction_type: "YEAR_OPENING",
    is_closing: false,
    transaction_date: nextFY.start_date,
  });

  for (const acc of openingLines) {
    const net = acc.totalDebit - acc.totalCredit;
    await createJournalEntry({
      journal_transaction: openingTransaction.id,
      ledger_account: acc.accountId,
      debit: net > 0 ? net : 0,
      credit: net < 0 ? Math.abs(net) : 0,
    });
  }
}

/**
 * Reopen a closed fiscal year:
 * 1. Delete all closing journal entries and their parent transactions
 * 2. Unlock the fiscal year
 */
export async function reopenYear(fiscalYearId) {
  // Delete closing transactions in this year
  const closingTransactions = await getAllJournalTransactions({
    filter: `fiscal_year = "${fiscalYearId}" && is_closing = true`,
  });

  for (const tx of closingTransactions) {
    const entries = await getAllJournalEntries({
      filter: `journal_transaction = "${tx.id}"`,
    });
    for (const entry of entries) {
      await deleteJournalEntry(entry.id);
    }
    await deleteJournalTransaction(tx.id);
  }

  // Delete YEAR_OPENING transaction in the next fiscal year (if any)
  const currentFY = await getFiscalYear(fiscalYearId);
  const nextDayDate = dayjs(currentFY.end_date).add(1, "day").format("YYYY-MM-DD");
  const nextFY = await getFiscalYearForDate(nextDayDate);

  if (nextFY) {
    const openingTransactions = await getAllJournalTransactions({
      filter: `fiscal_year = "${nextFY.id}" && transaction_type = "YEAR_OPENING"`,
    });
    for (const tx of openingTransactions) {
      const entries = await getAllJournalEntries({
        filter: `journal_transaction = "${tx.id}"`,
      });
      for (const entry of entries) {
        await deleteJournalEntry(entry.id);
      }
      await deleteJournalTransaction(tx.id);
    }
  }

  await updateFiscalYear(fiscalYearId, { is_locked: false });
}

/**
 * Permanently delete a fiscal year and all associated data:
 * - All journal entries for transactions in this year
 * - All journal transactions for this year
 * - All bank statement lines falling within the year's date range
 * - The fiscal year record itself
 */
export async function deleteFiscalYearWithAllData(fiscalYearId) {
  const fy = await getFiscalYear(fiscalYearId);

  // 1. Delete all journal entries + transactions for this year
  const transactions = await getAllJournalTransactions({
    filter: `fiscal_year = "${fiscalYearId}"`,
  });
  for (const tx of transactions) {
    const entries = await getAllJournalEntries({
      filter: `journal_transaction = "${tx.id}"`,
    });
    for (const entry of entries) {
      await deleteJournalEntry(entry.id);
    }
    await deleteJournalTransaction(tx.id);
  }

  // 2. Delete bank statement lines within the year's date range
  const bankLines = await getAllBankStatementLines({
    filter: `date >= "${fy.start_date}" && date <= "${fy.end_date}"`,
    fields: "id",
  });
  for (const line of bankLines) {
    await deleteBankStatementLine(line.id);
  }

  // 3. Delete the fiscal year itself
  await deleteFiscalYear(fiscalYearId);
}
