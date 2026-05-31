/**
 * @file bankStatementService.js
 * @description Service for importing and processing bank statement lines against the double-entry
 * bookkeeping ledger.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FINANCIAL RULES — DOUBLE-ENTRY BOOKKEEPING
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every financial event is recorded as a journal transaction containing two or
 * more journal entries where total debits always equal total credits.
 *
 * ACCOUNT CONVENTIONS (Dutch chart of accounts)
 *   1100  Bankrekening           – The organisation's bank account (asset, debit-normal)
 *   1300  Debiteuren             – Accounts Receivable / AR (asset, debit-normal)
 *   1600  Crediteuren            – Accounts Payable / AP (liability, credit-normal)
 *   Other – Any ledger account chosen manually as a counter account
 *
 * The bank account is not hard-coded to "1100". It is resolved at runtime via
 * the `is_bank_account` flag on a ledger account record, allowing the chart of
 * accounts to be reconfigured without code changes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PROCESSING PATH A — SALES INVOICE MATCH  (incoming payment)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Scenario: a customer pays a sales invoice. The bank statement shows a POSITIVE
 * amount (money coming in).
 *
 * Financial logic:
 *   When an invoice is raised the revenue was already recognised and a receivable
 *   was created (Debit AR 1300 / Credit Revenue). When the customer pays, the
 *   receivable is extinguished and cash increases:
 *
 *     Debit  Bank (1100)  +amount   ← cash received
 *     Credit AR   (1300)  +amount   ← receivable cleared
 *
 * Validation: a SALES invoice may only be matched to a POSITIVE bank amount.
 * If the amount is negative the user made a mistake (matched the wrong invoice).
 *
 * Status changes:
 *   fi_invoices.status              → "PAYED"
 *   fi_bank_statement_lines.status  → "PROCESSED"
 *   fi_bank_statement_lines.journal_transaction → <new tx id>
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PROCESSING PATH B — PURCHASE INVOICE MATCH  (outgoing payment)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Scenario: the organisation pays a supplier invoice. The bank statement shows
 * a NEGATIVE amount (money going out).
 *
 * Financial logic:
 *   When a purchase invoice is received the expense was recognised and a payable
 *   was created (Debit Expense / Credit AP 1600). When the supplier is paid, the
 *   payable is extinguished and cash decreases:
 *
 *     Debit  AP   (1600)  +amount   ← payable cleared
 *     Credit Bank (1100)  +amount   ← cash paid out
 *
 * Validation: a PURCHASE invoice may only be matched to a NEGATIVE bank amount.
 *
 * Status changes: same as path A.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PROCESSING PATH C — MANUAL COUNTER ACCOUNT  (no invoice)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Scenario: a bank mutation does not correspond to an invoice (e.g. rent, salary,
 * bank fees, interest). The user picks a counter account manually.
 *
 * Financial logic for POSITIVE amount (money in):
 *     Debit  Bank            +amount   ← cash received
 *     Credit Counter account +amount   ← e.g. membership income, interest
 *
 * Financial logic for NEGATIVE amount (money out):
 *     Debit  Counter account +amount   ← e.g. rent expense, salary
 *     Credit Bank            +amount   ← cash paid out
 *
 * Status changes:
 *   fi_bank_statement_lines.status              → "PROCESSED"
 *   fi_bank_statement_lines.journal_transaction → <new tx id>
 *   (no invoice status change)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ENTRY NUMBER FORMAT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Journal transactions are numbered per calendar year: "YYYY-NNN" (e.g. 2026-042).
 * The sequence resets to 001 at the start of each year. The last entry number is
 * determined by fetching the most recently created journal transaction.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ATOMICITY & COMPENSATING TRANSACTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PocketBase does not support true database transactions across collections.
 * Instead, `pb.createBatch()` is used to send all journal entries, the invoice
 * status update, and the bank line status update as a single HTTP request.
 *
 * If the batch fails after the journal transaction header has already been
 * created, a compensating delete is performed on the orphaned transaction to
 * keep the ledger clean. The original error is then re-thrown so the caller
 * can display it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DUPLICATE DETECTION (bulk import)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * When importing a bank statement file, the same lines may be imported twice by
 * accident. Duplicate detection compares `date` and `amount` (within €0.001) for
 * all lines in the overlapping date range. Matching lines are skipped and counted
 * separately so the user can review the import summary.
 */

import pb from "../pb";
import { getBankAccount, getLedgerAccounts } from "./ledgerAccountService";
import { getJournalTransactions, createJournalTransaction } from "./journalTransactionService";
import { getFiscalYearForDate } from "./fiscalYearService";
import { getSalesInvoice } from "./salesInvoiceService";

/**
 * Derives the next sequential journal entry number for a given year.
 *
 * Format: "YYYY-NNN" padded to at least 3 digits (e.g. "2026-001", "2026-042").
 * The counter resets when the year portion changes — i.e. the first entry of a
 * new year always starts at "YYYY-001" regardless of the previous year's count.
 *
 * @param {string|null} last - The entry_number of the most recently created
 *   journal transaction, or null if none exists yet.
 * @param {number} year - The calendar year for the new entry (e.g. 2026).
 * @returns {string} The next entry number, e.g. "2026-043".
 */
function nextEntryNumber(last, year) {
  if (!last) return `${year}-001`;
  const match = last.match(/^(\d{4})-(\d+)$/);
  if (!match) return `${year}-001`;
  const lastYear = parseInt(match[1]);
  const num = parseInt(match[2]);
  if (lastYear === year) return `${year}-${String(num + 1).padStart(3, "0")}`;
  return `${year}-001`;
}

/**
 * Fetches a single bank statement line by ID.
 *
 * @param {string} id - PocketBase record ID.
 * @param {object} [options] - Optional PocketBase query options (expand, fields, …).
 * @returns {Promise<object>} The fi_bank_statement_lines record.
 */
export async function getBankStatementLine(id, options = {}) {
  return await pb.collection("fi_bank_statement_lines").getOne(id, options);
}

/**
 * Fetches a paginated list of bank statement lines.
 *
 * @param {number} [page=1] - 1-based page number.
 * @param {number} [perPage=50] - Number of records per page.
 * @param {object} [options] - Optional PocketBase query options (filter, sort, …).
 * @returns {Promise<import("pocketbase").ListResult>} Paginated result.
 */
export async function getBankStatementLines(page = 1, perPage = 50, options = {}) {
  return await pb.collection("fi_bank_statement_lines").getList(page, perPage, options);
}

/**
 * Fetches all bank statement lines (no pagination).
 *
 * @param {object} [options] - Optional PocketBase query options.
 * @returns {Promise<object[]>} Array of all fi_bank_statement_lines records.
 */
export async function getAllBankStatementLines(options = {}) {
  return await pb.collection("fi_bank_statement_lines").getFullList(options);
}

/**
 * Creates a new bank statement line record.
 *
 * Newly imported lines should be created with `status: "PENDING"`. Use
 * `bulkCreateBankStatementLines` for batch imports with duplicate detection.
 *
 * @param {object} data - Field values for the new record.
 * @returns {Promise<object>} The created fi_bank_statement_lines record.
 */
export async function createBankStatementLine(data) {
  return await pb.collection("fi_bank_statement_lines").create(data);
}

/**
 * Updates an existing bank statement line record.
 *
 * @param {string} id - PocketBase record ID.
 * @param {object} data - Fields to update.
 * @returns {Promise<object>} The updated record.
 */
export async function updateBankStatementLine(id, data) {
  return await pb.collection("fi_bank_statement_lines").update(id, data);
}

/**
 * Deletes a bank statement line record.
 *
 * Only PENDING lines should be deleted. Deleting a PROCESSED line would leave
 * the associated journal transaction without a source reference.
 *
 * @param {string} id - PocketBase record ID.
 * @returns {Promise<void>}
 */
export async function deleteBankStatementLine(id) {
  return await pb.collection("fi_bank_statement_lines").delete(id);
}

/**
 * Processes a bank statement line by creating the corresponding double-entry
 * journal transaction and marking the line (and optionally an invoice) as processed.
 *
 * This is the core bookkeeping function. It supports three processing paths
 * depending on whether an invoice is matched or a manual counter account is used.
 * See the module-level documentation for the full financial rules.
 *
 * Prerequisites:
 *   - A ledger account with `is_bank_account = true` must exist.
 *   - A fiscal year covering `line.date` must exist.
 *   - The line must have `status !== "PROCESSED"`.
 *
 * @param {object} line - The fi_bank_statement_lines record to process.
 *   Must include at minimum: `id`, `date`, `amount`, `status`, `description`.
 * @param {object} [options={}]
 * @param {string} [options.counterAccountId] - Ledger account ID to use as
 *   counter account when no invoice is matched (Path C). Required if `invoiceId`
 *   is not provided.
 * @param {string} [options.invoiceId] - ID of an fi_invoices record to match
 *   against this bank line (Path A or B). When provided, `counterAccountId` is
 *   ignored.
 *
 * @returns {Promise<object>} The created fi_journal_transactions record.
 *
 * @throws {Error} If the line is already processed.
 * @throws {Error} If no bank account ledger account exists (`is_bank_account`).
 * @throws {Error} If no fiscal year covers the line date.
 * @throws {Error} If a SALES invoice is matched to a negative amount (or vice versa).
 * @throws {Error} If neither `invoiceId` nor `counterAccountId` is provided.
 * @throws {Error} If the required AR (1300) or AP (1600) account is not found.
 */
export async function processLine(line, { counterAccountId, invoiceId, batchRunId } = {}) {
  if (line.status === "PROCESSED")
    throw new Error("Deze regel is al verwerkt.");

  // Resolve prerequisites in parallel: bank account, fiscal year, last entry number
  const [bankAccount, fiscalYear, lastPage] = await Promise.all([
    getBankAccount(),
    getFiscalYearForDate(line.date),
    getJournalTransactions(1, 1, { sort: "-created" }),
  ]);

  if (!bankAccount)
    throw new Error("Geen bankrekening ingesteld. Markeer een grootboekrekening met 'is_bank_account'.");
  if (!fiscalYear)
    throw new Error(`Geen boekjaar gevonden voor datum ${line.date}.`);

  const txYear = new Date(line.date).getFullYear();
  const lastNumber = lastPage?.items?.[0]?.entry_number ?? null;
  const entryNumber = nextEntryNumber(lastNumber, txYear);

  // Always work with the absolute value; direction is determined by sign and path
  const absAmount = Math.abs(line.amount);
  const isPositive = line.amount >= 0;

  // ──────────────────────────────────────────────────────────────────────────
  // PATH A/B: Invoice match
  // ──────────────────────────────────────────────────────────────────────────
  if (invoiceId) {
    const invoice = await getSalesInvoice(invoiceId);

    // Guard: prevent matching wrong invoice type to wrong payment direction
    if (invoice.type === "SALES" && !isPositive)
      throw new Error("Een verkoopfactuur kan alleen aan een positief bankbedrag worden gekoppeld.");
    if (invoice.type === "PURCHASE" && isPositive)
      throw new Error("Een inkoopfactuur kan alleen aan een negatief bankbedrag worden gekoppeld.");

    // Resolve AR (1300) for sales or AP (1600) for purchases
    const accountNumber = invoice.type === "SALES" ? "1300" : "1600";
    const accounts = await getLedgerAccounts(1, 1, { filter: `account_number = "${accountNumber}"` });
    const arApAccount = accounts.items[0];
    if (!arApAccount)
      throw new Error(`Grootboekrekening ${accountNumber} niet gevonden.`);

    const prefix = invoice.type === "SALES" ? "Betaling" : "Inkoop";
    const description = `${prefix} ${invoice.invoice_number}${line.description ? ` - ${line.description}` : ""}`.slice(0, 255);

    // Create the journal transaction header first (needed for entry foreign keys)
    const tx = await createJournalTransaction({
      entry_number: entryNumber,
      transaction_date: line.date,
      description,
      transaction_type: invoice.type === "SALES" ? "BANK_IN" : "BANK_OUT",
      source_type: "fi_invoices",
      source_id: invoiceId,
      fiscal_year: fiscalYear.id,
    });

    // Batch: journal entries + invoice status + bank line status (single HTTP round-trip)
    const batch = pb.createBatch();
    if (invoice.type === "SALES") {
      // Path A — incoming payment: Debit Bank, Credit AR (1300)
      batch.collection("fi_journal_entries").create({ journal_transaction: tx.id, ledger_account: bankAccount.id, debit: absAmount, credit: 0 });
      batch.collection("fi_journal_entries").create({ journal_transaction: tx.id, ledger_account: arApAccount.id, debit: 0, credit: absAmount });
    } else {
      // Path B — outgoing payment: Debit AP (1600), Credit Bank
      batch.collection("fi_journal_entries").create({ journal_transaction: tx.id, ledger_account: arApAccount.id, debit: absAmount, credit: 0 });
      batch.collection("fi_journal_entries").create({ journal_transaction: tx.id, ledger_account: bankAccount.id, debit: 0, credit: absAmount });
    }
    batch.collection("fi_invoices").update(invoiceId, { status: "PAYED" });
    batch.collection("fi_bank_statement_lines").update(line.id, { status: "PROCESSED", journal_transaction: tx.id });

    try {
      await batch.send();
    } catch (e) {
      // Compensating transaction: the journal transaction header was already
      // persisted before the batch. Delete it to avoid an orphaned record.
      try { await pb.collection("fi_journal_transactions").delete(tx.id); } catch (cleanupErr) { console.error("Cleanup failed:", cleanupErr); }
      throw e;
    }
    return tx;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PATH D: Batch Run match
  // ──────────────────────────────────────────────────────────────────────────
  if (batchRunId) {
    const batchRun = await pb.collection("fi_batch_runs").getOne(batchRunId);

    const accounts = await getLedgerAccounts(1, 1, { filter: 'is_suspense_account = true' });
    const account1100 = accounts.items[0];
    if (!account1100) throw new Error("Geen tussenrekening (is_suspense_account) gevonden.");

    const tx = await createJournalTransaction({
      entry_number: entryNumber,
      transaction_date: line.date,
      description: batchRun.description || line.description || "",
      transaction_type: "SEPA_BATCH",
      source_type: "fi_batch_runs",
      source_id: batchRunId,
      fiscal_year: fiscalYear.id,
    });

    // Fetch all invoices belonging to this batch run so we can mark them PAYED
    const batchInvoices = await pb.collection("fi_invoices").getFullList({
      filter: `batch_run = "${batchRunId}"`,
      fields: "id",
    });

    // Batch 1: core ops (journal entries + bank line) — always atomic
    const coreBatch = pb.createBatch();
    coreBatch.collection("fi_journal_entries").create({ journal_transaction: tx.id, ledger_account: bankAccount.id, debit: absAmount, credit: 0 });
    coreBatch.collection("fi_journal_entries").create({ journal_transaction: tx.id, ledger_account: account1100.id, debit: 0, credit: absAmount });
    coreBatch.collection("fi_bank_statement_lines").update(line.id, { status: "PROCESSED", journal_transaction: tx.id });

    try {
      await coreBatch.send();
    } catch (e) {
      try { await pb.collection("fi_journal_transactions").delete(tx.id); } catch (cleanupErr) { console.error("Cleanup failed:", cleanupErr); }
      throw e;
    }

    // Mark invoices PAYED in chunks of 50 (PocketBase batch limit)
    const CHUNK_SIZE = 50;
    for (let i = 0; i < batchInvoices.length; i += CHUNK_SIZE) {
      const invoiceBatch = pb.createBatch();
      for (const invoice of batchInvoices.slice(i, i + CHUNK_SIZE)) {
        invoiceBatch.collection("fi_invoices").update(invoice.id, { status: "PAYED" });
      }
      await invoiceBatch.send();
    }

    return tx;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PATH C: Manual counter account (no invoice)
  // ──────────────────────────────────────────────────────────────────────────
  if (!counterAccountId)
    throw new Error("Selecteer een tegenrekening, factuur of batchrun.");

  const tx = await createJournalTransaction({
    entry_number: entryNumber,
    transaction_date: line.date,
    description: line.description || "",
    transaction_type: "import",
    source_id: "",
    fiscal_year: fiscalYear.id,
  });

  // Positive amount (money in):  Debit Bank, Credit counter account
  // Negative amount (money out): Debit counter account, Credit Bank
  const batch = pb.createBatch();
  batch.collection("fi_journal_entries").create({ journal_transaction: tx.id, ledger_account: bankAccount.id, debit: isPositive ? absAmount : 0, credit: isPositive ? 0 : absAmount });
  batch.collection("fi_journal_entries").create({ journal_transaction: tx.id, ledger_account: counterAccountId, debit: isPositive ? 0 : absAmount, credit: isPositive ? absAmount : 0 });
  batch.collection("fi_bank_statement_lines").update(line.id, { status: "PROCESSED", journal_transaction: tx.id });

  try {
    await batch.send();
  } catch (e) {
    try { await pb.collection("fi_journal_transactions").delete(tx.id); } catch (cleanupErr) { console.error("Cleanup failed:", cleanupErr); }
    throw e;
  }
  return tx;
}

/**
 * Bulk-imports an array of parsed bank statement lines into fi_bank_statement_lines.
 *
 * All lines are created with `status: "PENDING"` and must be individually processed
 * via `processLine` before they affect the ledger.
 *
 * DUPLICATE DETECTION
 * When `skipDuplicates` is true, the function first fetches all existing lines
 * within the date range of the import batch, then skips any incoming line whose
 * (date, amount) pair already exists in the database (within a €0.001 tolerance
 * to avoid floating-point false negatives). This prevents double-importing when
 * the same bank statement export is uploaded more than once.
 *
 * @param {object[]} lines - Array of line objects to import. Each object should
 *   contain at minimum: `date` (YYYY-MM-DD string), `amount` (number), and any
 *   other fields supported by fi_bank_statement_lines (e.g. `description`, `iban`).
 * @param {object} [options={}]
 * @param {boolean} [options.skipDuplicates=false] - When true, lines that already
 *   exist in the database for the same date and amount are silently skipped.
 *
 * @returns {Promise<{total: number, successful: number, skipped: number, failed: number, errors: object[]}>}
 *   A summary object:
 *   - `total`      – total number of lines in the input array
 *   - `successful` – lines that were created successfully
 *   - `skipped`    – lines skipped due to duplicate detection
 *   - `failed`     – lines that threw an error during creation
 *   - `errors`     – array of `{ row, error, data }` objects for failed lines
 */
export async function bulkCreateBankStatementLines(lines, options = {}) {
  const { skipDuplicates = false } = options;
  const results = { total: lines.length, successful: 0, skipped: 0, failed: 0, errors: [] };

  let existingLines = [];
  if (skipDuplicates && lines.length > 0) {
    // Only fetch from the date range present in this import to keep the query small
    const dates = lines.map((l) => l.date).sort();
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    try {
      const existing = await pb.collection("fi_bank_statement_lines").getFullList({
        filter: `date >= "${minDate}" && date <= "${maxDate}"`,
        fields: "date,amount",
      });
      existingLines = existing;
    } catch {
      // If the duplicate-check fetch fails, proceed without it rather than
      // blocking the entire import
    }
  }

  for (const [i, line] of lines.entries()) {
    try {
      if (skipDuplicates) {
        // Tolerance of 0.001 guards against floating-point rounding differences
        // between the imported CSV value and the stored value
        const isDuplicate = existingLines.some((e) => e.date === line.date && Math.abs(e.amount - line.amount) < 0.001);
        if (isDuplicate) {
          results.skipped++;
          continue;
        }
      }
      await pb.collection("fi_bank_statement_lines").create({ ...line, status: "PENDING" });
      results.successful++;
    } catch (e) {
      results.failed++;
      results.errors.push({ row: i + 1, error: e.message, data: line });
    }
  }
  return results;
}
