import { jsPDF } from "jspdf";
import pb from "../pb";
import { formatDateTime } from "./dateTimeUtils";

const MARGIN = 20;
const PAGE_WIDTH = 210; // A4 mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

async function fetchImageAsDataUrl(url) {
  try {
    const headers = pb.authStore.token ? { Authorization: pb.authStore.token } : {};
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
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

export async function generateMinutesPdf(meeting, topics, allMinutes, logoUrl) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // Logo
  const logoData = logoUrl ? await fetchImageAsDataUrl(logoUrl) : null;
  if (logoData) {
    const logoW = CONTENT_WIDTH;
    const logoH = Math.round(logoW * (173 / 674));
    doc.addImage(logoData, "JPEG", MARGIN, y, logoW, logoH);
    y += logoH + 8;
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Notulen - ${meeting.name}`, MARGIN, y);
  y += 8;

  // Metadata
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (meeting.date_time) {
    doc.setFont("helvetica", "bold");
    doc.text("Datum: ", MARGIN, y);
    const dateLabel = doc.getTextWidth("Datum: ");
    doc.setFont("helvetica", "normal");
    doc.text(formatDateTime(meeting.date_time), MARGIN + dateLabel, y);
    y += 6;
  }

  if (meeting.expand?.present?.length > 0) {
    const presentNames = meeting.expand.present.map((u) => u.name).join(", ");
    doc.setFont("helvetica", "bold");
    doc.text("Aanwezig: ", MARGIN, y);
    const aanwLabel = doc.getTextWidth("Aanwezig: ");
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(presentNames, CONTENT_WIDTH - aanwLabel);
    doc.text(lines, MARGIN + aanwLabel, y);
    y += lines.length * 5 + 1;
  }

  // Divider
  y += 3;
  doc.setDrawColor(180);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;

  // Topics and minutes
  doc.setFontSize(11);
  topics.forEach((topic, tIdx) => {
    y = addPageIfNeeded(doc, y, 14);

    // Topic heading
    doc.setFont("helvetica", "bold");
    doc.text(`${tIdx + 1}. ${topic.name}`, MARGIN, y);
    y += 6;

    const topicMinutes = allMinutes.filter((m) => m.meeting_topic === topic.id);

    doc.setFontSize(10);
    if (topicMinutes.length === 0) {
      y = addPageIfNeeded(doc, y, 6);
      doc.setFont("helvetica", "italic");
      doc.text("Geen notulen", MARGIN + 4, y);
      y += 5;
    } else {
      topicMinutes.forEach((minute, mIdx) => {
        const prefix = `${tIdx + 1}.${mIdx + 1} `;

        let label = "";
        let labelBold = false;
        if (minute.type === "action") {
          label = `Actie ${minute.expand?.assigned_to?.name ?? "—"}: `;
          labelBold = true;
        } else if (minute.type === "decision") {
          label = "Besluit: ";
          labelBold = true;
        }

        const prefixX = MARGIN + 4;
        const textStartX = prefixX + doc.getTextWidth(prefix);

        // Calculate available width for label+text
        const fullText = label + minute.name;
        const availableWidth = CONTENT_WIDTH - 4 - doc.getTextWidth(prefix);
        const wrappedLines = doc.splitTextToSize(fullText, availableWidth);
        const lineCount = wrappedLines.length;

        y = addPageIfNeeded(doc, y, lineCount * 5 + 2);

        doc.setFont("helvetica", "normal");
        doc.text(prefix, prefixX, y);

        if (labelBold && label) {
          // First line: bold label + rest of text
          const firstLine = wrappedLines[0];
          const labelInFirstLine = label.length <= firstLine.length ? label : firstLine;
          doc.setFont("helvetica", "bold");
          doc.text(labelInFirstLine, textStartX, y);
          const afterLabel = textStartX + doc.getTextWidth(labelInFirstLine);
          doc.setFont("helvetica", "normal");
          const restOfFirstLine = firstLine.slice(labelInFirstLine.length);
          if (restOfFirstLine) {
            doc.text(restOfFirstLine, afterLabel, y);
          }
          // Remaining lines
          if (wrappedLines.length > 1) {
            doc.text(wrappedLines.slice(1), textStartX, y + 5);
          }
        } else {
          doc.setFont("helvetica", "normal");
          doc.text(wrappedLines, textStartX, y);
        }

        y += lineCount * 5 + 1;
      });
    }

    doc.setFontSize(11);
    y += 2;
  });

  const date = meeting.date_time ? new Date(meeting.date_time) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  doc.save(`Notulen vergadering ${year}-${month}-${day}.pdf`);
}
