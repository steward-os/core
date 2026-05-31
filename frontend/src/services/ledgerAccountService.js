import pb from "../pb";

export async function getLedgerAccount(id, options = {}) {
  return await pb.collection("fi_ledger_accounts").getOne(id, options);
}

export async function getLedgerAccounts(page = 1, perPage = 50, options = {}) {
  return await pb.collection("fi_ledger_accounts").getList(page, perPage, options);
}

export async function getAllLedgerAccounts(options = {}) {
  return await pb.collection("fi_ledger_accounts").getFullList(options);
}

export async function getBankAccount() {
  const result = await pb.collection("fi_ledger_accounts").getList(1, 1, {
    filter: "is_bank_account = true",
  });
  return result.items[0] ?? null;
}

export async function createLedgerAccount(data) {
  return await pb.collection("fi_ledger_accounts").create(data);
}

export async function updateLedgerAccount(id, data) {
  return await pb.collection("fi_ledger_accounts").update(id, data);
}

export async function deleteLedgerAccount(id) {
  return await pb.collection("fi_ledger_accounts").delete(id);
}
