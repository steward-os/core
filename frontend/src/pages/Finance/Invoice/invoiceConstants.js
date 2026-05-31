export const STATUS_LABELS = {
  DRAFT: "Concept",
  BOOKED: "Geboekt",
  PAYED: "Betaald",
};

export const STATUS_CLASSES = {
  DRAFT: "bg-gray-100 text-gray-700",
  BOOKED: "bg-purple-100 text-purple-700",
  PAYED: "bg-green-100 text-green-700",
};

export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Concept" },
  { value: "BOOKED", label: "Geboekt" },
  { value: "PAYED", label: "Betaald" },
];

export const HEADER_COLUMNS = [
  {
    label: "Factuurnummer",
    width: "15%",
    field: "invoice_number",
    sortable: true,
    filter: "invoice_number",
    mobilePosition: "title",
  },
  {
    label: "Factuurdatum",
    width: "15%",
    field: "invoice_date",
    sortable: true,
    render: (item) => item.invoice_date?.slice(0, 10) || "-",
    mobilePosition: "info",
  },
  {
    label: "Relatie",
    width: "15%",
    field: "organisation",
    sortable: true,
    filter: (value) => `(relation.organisation ~ "${value}" || relation.first_name ~ "${value}" || relation.last_name ~ "${value}")`,
    render: (item) => {
      const rel = item.expand?.relation;
      if (!rel) return "-";
      const name = [rel.first_name, rel.last_name].filter(Boolean).join(" ");
      const org = rel.organisation ? rel.organisation + ": " : "";
      return org + name || "-";
    },
  },
  {
    label: "Bedrag",
    width: "15%",
    field: "amount",
    sortable: false,
    render: (item) => {
      const lines = item.expand?.["fi_invoice_lines(invoice)"] || [];
      const total = lines.reduce((sum, l) => sum + (l.amount || 0), 0);
      return lines.length > 0
        ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(total)
        : "-";
    },
  },
  {
    label: "Status",
    width: "15%",
    field: "status",
    sortable: true,
    filter: "status",
    render: (item) => STATUS_LABELS[item.status] || item.status || "-",
  },
];

export const formatCurrency = (amount) =>
  amount !== null && amount !== undefined
    ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
    : "-";

export const SALES_INVOICE_CONFIG = {
  type: "SALES",
  basePath: "/finance/sales-invoices",
  listTitle: "Verkoopfacturen",
  newTitle: "Nieuwe verkoopfactuur",
  editTitle: "Verkoopfactuur bewerken",
  addAriaLabel: "Nieuwe verkoopfactuur",
  backAriaLabel: "Terug naar verkoopfacturen",
  emptyMessage: "Geen verkoopfacturen gevonden.",
  invoiceNumberPlaceholder: "Bijv. 2025-001",
  autoNumberOnCreate: true,
  showRelation: true,
  booking: {
    counterpartAccountNumber: "1300",
    counterpartAccountName: "Debiteuren",
    transactionType: "INVOICE_OUT",
    counterpartIsDebit: true,
  },
};

export const PURCHASE_INVOICE_CONFIG = {
  type: "PURCHASE",
  basePath: "/finance/purchase-invoices",
  listTitle: "Inkoopfacturen",
  newTitle: "Nieuwe inkoopfactuur",
  editTitle: "Inkoopfactuur bewerken",
  addAriaLabel: "Nieuwe inkoopfactuur",
  backAriaLabel: "Terug naar inkoopfacturen",
  emptyMessage: "Geen inkoopfacturen gevonden.",
  invoiceNumberPlaceholder: "Bijv. INK-2026-001",
  autoNumberOnCreate: false,
  showRelation: true,
  booking: {
    counterpartAccountNumber: "1600",
    counterpartAccountName: "Crediteuren",
    transactionType: "INVOICE_IN",
    counterpartIsDebit: false,
  },
};
