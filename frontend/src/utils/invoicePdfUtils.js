import { jsPDF } from "jspdf";
import logoUrl from "../assets/Logo_fanfare.jpg";
import { STATUS_LABELS, formatCurrency } from "../pages/Finance/Invoice/invoiceConstants";

const MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

async function fetchImageAsDataUrl(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function addPageIfNeeded(doc, y, neededSpace = 10) {
  if (y + neededSpace > 277) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

export async function generateInvoicePdf(invoice, lines, ledgerAccounts) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // Logo
  const logoData = await fetchImageAsDataUrl(logoUrl);
  if (logoData) {
    const logoW = CONTENT_WIDTH;
    const logoH = Math.round(logoW * (173 / 674));
    doc.addImage(logoData, "JPEG", MARGIN, y, logoW, logoH);
    y += logoH + 10;
  }

  // Title + invoice number
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("FACTUUR", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(invoice.invoice_number || "-", MARGIN, y + 7);
  y += 16;

  // Divider
  doc.setDrawColor(180);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  // Two-column: relation (left) + metadata (right)
  const col2X = PAGE_WIDTH / 2 + 5;
  const startY = y;
  let leftY = y;
  let rightY = y;

  // Left: relation
  const rel = invoice.expand?.relation;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Aan:", MARGIN, leftY);
  leftY += 5;
  doc.setFont("helvetica", "normal");

  if (rel?.organisation) {
    doc.text(rel.organisation, MARGIN, leftY);
    leftY += 5;
  }
  const personName = [rel?.first_name, rel?.last_name].filter(Boolean).join(" ");
  if (personName) {
    doc.text(personName, MARGIN, leftY);
    leftY += 5;
  }
  if (rel?.email) {
    doc.text(rel.email, MARGIN, leftY);
    leftY += 5;
  }

  // Right: invoice metadata
  const labelW = 32;
  const metaRows = [
    ["Factuurdatum:", invoice.invoice_date?.slice(0, 10) || "-"],
    ["Vervaldatum:", invoice.due_date?.slice(0, 10) || "-"],
  ];
  metaRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, col2X, rightY);
    doc.setFont("helvetica", "normal");
    doc.text(value, col2X + labelW, rightY);
    rightY += 5;
  });

  y = Math.max(leftY, rightY) + 8;

  // Description
  if (invoice.description) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(invoice.description, CONTENT_WIDTH);
    doc.text(descLines, MARGIN, y);
    y += descLines.length * 5 + 6;
  }

  // Lines table header
  y = addPageIfNeeded(doc, y, 20);
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN, y - 5, CONTENT_WIDTH, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Omschrijving", MARGIN + 2, y);
  doc.text("Bedrag", PAGE_WIDTH - MARGIN - 2, y, { align: "right" });
  y += 5;

  // Lines
  doc.setFont("helvetica", "normal");
  lines.forEach((line) => {
    const desc = line.description || "-";
    const descLines = doc.splitTextToSize(desc, CONTENT_WIDTH - 35);
    y = addPageIfNeeded(doc, y, descLines.length * 5 + 3);
    doc.setDrawColor(220);
    doc.line(MARGIN, y - 3, PAGE_WIDTH - MARGIN, y - 3);
    doc.text(descLines, MARGIN + 2, y);
    doc.text(formatCurrency(line.amount), PAGE_WIDTH - MARGIN - 2, y, { align: "right" });
    y += descLines.length * 5 + 1;
  });

  // Total
  y += 3;
  doc.setDrawColor(100);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;
  const total = lines.reduce((sum, l) => sum + (l.amount ?? 0), 0);
  doc.setFont("helvetica", "bold");
  doc.text("Totaal", MARGIN + 2, y);
  doc.text(formatCurrency(total), PAGE_WIDTH - MARGIN - 2, y, { align: "right" });

  const safeFilename = (invoice.invoice_number || "factuur").replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`${safeFilename}.pdf`);
}
