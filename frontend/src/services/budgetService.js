import pb from "../pb";

export async function getBudget(fiscalYearId, ledgerAccountId) {
  const results = await pb.collection("fi_budgets").getList(1, 1, {
    filter: `fiscal_year = "${fiscalYearId}" && fi_ledger_account = "${ledgerAccountId}"`,
  });
  return results.items[0] ?? null;
}

export async function createBudget(data) {
  return await pb.collection("fi_budgets").create(data);
}

export async function updateBudget(id, data) {
  return await pb.collection("fi_budgets").update(id, data);
}
