import pb from "../pb";

export async function getSalesInvoice(id, options = {}) {
  return await pb.collection("fi_invoices").getOne(id, options);
}

export async function getSalesInvoices(page = 1, perPage = 50, options = {}) {
  return await pb.collection("fi_invoices").getList(page, perPage, options);
}

export async function createSalesInvoice(data) {
  return await pb.collection("fi_invoices").create(data);
}

export async function updateSalesInvoice(id, data) {
  return await pb.collection("fi_invoices").update(id, data);
}

export async function deleteSalesInvoice(id) {
  return await pb.collection("fi_invoices").delete(id);
}

export async function getAllInvoices(options = {}) {
  return await pb.collection("fi_invoices").getFullList({ sort: "-invoice_date", ...options });
}

export async function getNextInvoiceNumber() {
  const year = new Date().getFullYear();
  const result = await pb.collection("fi_invoices").getList(1, 1, {
    filter: `type = "SALES" && invoice_number ~ "${year}-"`,
    sort: "-invoice_number",
    requestKey: null,
  });
  if (result.items.length === 0) {
    return `${year}-001`;
  }
  const last = result.items[0].invoice_number;
  const seq = parseInt(last.split("-")[1], 10) || 0;
  return `${year}-${String(seq + 1).padStart(3, "0")}`;
}
