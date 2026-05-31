import pb from "../pb";

export async function getFiscalYear(id, options = {}) {
  return await pb.collection("fi_fiscal_years").getOne(id, options);
}

export async function getFiscalYears(page = 1, perPage = 50, options = {}) {
  return await pb.collection("fi_fiscal_years").getList(page, perPage, options);
}

export async function getAllFiscalYears(options = {}) {
  return await pb.collection("fi_fiscal_years").getFullList(options);
}

export async function createFiscalYear(data) {
  return await pb.collection("fi_fiscal_years").create(data);
}

export async function updateFiscalYear(id, data) {
  return await pb.collection("fi_fiscal_years").update(id, data);
}

export async function deleteFiscalYear(id) {
  return await pb.collection("fi_fiscal_years").delete(id);
}

export async function getFiscalYearForDate(date) {
  const results = await pb.collection("fi_fiscal_years").getList(1, 1, {
    filter: `start_date <= "${date}" && end_date >= "${date}"`,
  });
  return results.items[0] ?? null;
}
