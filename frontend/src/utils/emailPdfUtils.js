import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { formatDateTime } from "./dateTimeUtils";
import pb from "../pb";

const MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function addPageIfNeeded(doc, y, neededSpace = 10) {
  if (y + neededSpace > 277) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function htmlToPlainText(html) {
  if (!html) return "";
  const d = new DOMParser().parseFromString(html, "text/html");
  return (d.body.innerText || d.body.textContent || "").trim();
}

function drawLabelValue(doc, y, label, value, labelWidth = 35) {
  doc.setFont("helvetica", "bold");
  doc.text(label, MARGIN, y);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(value, CONTENT_WIDTH - labelWidth);
  doc.text(lines, MARGIN + labelWidth, y);
  return y + lines.length * 5 + 1;
}

function buildEmailPdf(email) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(email.subject || "(geen onderwerp)", MARGIN, y);
  y += 7;
  doc.setDrawColor(180);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;
  doc.setFontSize(10);

  // Metadata rows (only rendered when non-empty)
  const LABEL_W = 35;
  const fields = [
    ["Van:", email.from],
    ["Aan:", email.to],
    ["CC:", email.cc],
    ["Datum:", email.date ? formatDateTime(email.date) : null],
    ["Onderwerp:", email.subject],
    ["Omschrijving:", email.description],
    ["Discussie:", email.expand?.topic?.title],
    ["Bijlagen:", email.attachments?.length > 0 ? email.attachments.join(", ") : null],
  ];
  for (const [label, value] of fields) {
    if (!value) continue;
    y = addPageIfNeeded(doc, y, 7);
    y = drawLabelValue(doc, y, label, value, LABEL_W);
  }

  // Divider before body
  y += 3;
  doc.setDrawColor(220);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 5;

  // Body as plain text
  if (email.body) {
    const bodyText = htmlToPlainText(email.body);
    if (bodyText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const bodyLines = doc.splitTextToSize(bodyText, CONTENT_WIDTH);
      for (const line of bodyLines) {
        y = addPageIfNeeded(doc, y, 5);
        doc.text(line, MARGIN, y);
        y += 5;
      }
    }
  }

  return doc;
}

function sanitize(str) {
  if (!str) return "";
  return String(str)
    .replace(/[/\\?%*:|"<>]/g, "-")
    .trim();
}

function buildBaseFilename(email) {
  const date = email.date ? email.date.slice(0, 10) : "";
  const direction = sanitize(email.direction || "");
  const topic = sanitize(email.expand?.topic?.title || "");
  const name = sanitize(email.name || "");
  const description = sanitize(email.description || "");
  return `${date}-${direction}-${topic}.${name}-${description}`;
}

export async function generateEmailsBatchPdf(emails) {
  const zip = new JSZip();

  for (const email of emails) {
    const base = buildBaseFilename(email);

    // PDF
    const doc = buildEmailPdf(email);
    zip.file(`${base}.pdf`, doc.output("blob"));

    // Attachments
    if (email.attachments?.length > 0) {
      for (const filename of email.attachments) {
        const url = pb.files.getURL(email, filename);
        const response = await fetch(url);
        const blob = await response.blob();
        zip.file(`${base}-attachment-${filename}`, blob);
      }
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const timestamp = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `emails-export-${timestamp}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
