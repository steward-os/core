import pb from "../pb";

export async function getJournalTransaction(id, options = {}) {
  return await pb.collection("fi_journal_transactions").getOne(id, options);
}

export async function getJournalTransactions(page = 1, perPage = 50, options = {}) {
  return await pb.collection("fi_journal_transactions").getList(page, perPage, options);
}

export async function getTransactionWithEntries(id) {
  return await pb.collection("fi_journal_transactions").getOne(id, {
    expand: "fiscal_year,fi_journal_entries_via_journal_transaction,fi_journal_entries_via_journal_transaction.ledger_account",
  });
}

export async function getNextEntryNumber() {
  const result = await pb.collection("fi_journal_transactions").getList(1, 1, {
    sort: "-created",
    requestKey: null,
  });
  const last = result.items[0]?.entry_number ?? null;
  const currentYear = new Date().getFullYear();
  if (!last) return `${currentYear}-001`;
  const match = last.match(/^(\d{4})-(\d+)$/);
  if (!match || parseInt(match[1]) !== currentYear) return `${currentYear}-001`;
  return `${currentYear}-${String(parseInt(match[2]) + 1).padStart(3, "0")}`;
}

export async function createJournalTransaction(data) {
  return await pb.collection("fi_journal_transactions").create(data);
}

export async function updateJournalTransaction(id, data) {
  return await pb.collection("fi_journal_transactions").update(id, data);
}

export async function deleteJournalTransaction(id) {
  return await pb.collection("fi_journal_transactions").delete(id);
}

export async function getJournalEntries(transactionId) {
  return await pb.collection("fi_journal_entries").getFullList({
    filter: `journal_transaction = "${transactionId}"`,
    expand: "ledger_account",
    sort: "created",
  });
}

export async function getAllJournalTransactions(options = {}) {
  return await pb.collection("fi_journal_transactions").getFullList(options);
}

export async function getAllJournalEntries(options = {}) {
  return await pb.collection("fi_journal_entries").getFullList(options);
}

export async function createJournalEntry(data) {
  return await pb.collection("fi_journal_entries").create(data);
}

export async function updateJournalEntry(id, data) {
  return await pb.collection("fi_journal_entries").update(id, data);
}

export async function deleteJournalEntry(id) {
  return await pb.collection("fi_journal_entries").delete(id);
}

export async function getEntriesByLedgerAccount(ledgerAccountId, options = {}) {
  return await pb.collection("fi_journal_entries").getFullList({
    filter: `ledger_account = "${ledgerAccountId}"`,
    expand: "journal_transaction,journal_transaction.fiscal_year",
    sort: "journal_transaction.transaction_date,journal_transaction.created",
    ...options,
  });
}

export async function getJournalEntryBalancesByAccount() {
  const entries = await pb.collection("fi_journal_entries").getFullList({
    fields: "ledger_account,debit,credit",
  });
  const map = {};
  for (const entry of entries) {
    const id = entry.ledger_account;
    if (!map[id]) map[id] = { totalDebit: 0, totalCredit: 0 };
    map[id].totalDebit += entry.debit || 0;
    map[id].totalCredit += entry.credit || 0;
  }
  return map;
}

export async function getJournalEntryBalancesByAccountUntilDate(date) {
  const options = { fields: "ledger_account,debit,credit", requestKey: date || "all" };
  if (date) options.filter = `journal_transaction.transaction_date <= "${date}"`;
  const entries = await pb.collection("fi_journal_entries").getFullList(options);
  const map = {};
  for (const entry of entries) {
    const id = entry.ledger_account;
    if (!map[id]) map[id] = { totalDebit: 0, totalCredit: 0 };
    map[id].totalDebit += entry.debit || 0;
    map[id].totalCredit += entry.credit || 0;
  }
  return map;
}
