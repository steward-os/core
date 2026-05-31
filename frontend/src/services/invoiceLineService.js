import pb from "../pb";

export async function getInvoiceLines(options = {}) {
  return await pb.collection("fi_invoice_lines").getFullList(options);
}

export async function createInvoiceLine(data) {
  return await pb.collection("fi_invoice_lines").create(data);
}

export async function updateInvoiceLine(id, data) {
  return await pb.collection("fi_invoice_lines").update(id, data);
}

export async function deleteInvoiceLine(id) {
  return await pb.collection("fi_invoice_lines").delete(id);
}
