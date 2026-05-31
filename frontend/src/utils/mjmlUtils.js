import mjml2html from "mjml-browser";

export async function compileMjml(mjmlString) {
  if (!mjmlString) throw new Error("Geen MJML — controleer of het template een layout heeft en er blokken zijn.");
  const { html, errors } = await mjml2html(mjmlString, { validationLevel: "soft" });
  if (errors?.length) console.warn("MJML errors:", errors);
  if (!html) throw new Error(`MJML compilatie mislukt. Errors: ${JSON.stringify(errors)}`);
  return html;
}

export function injectContent(mjml, content = {}) {
  return (mjml || "").replace(/\{\{(\w+)\}\}/g, (_, key) => content[key] ?? "");
}

const DEFAULT_LAYOUT = `<mjml><mj-body>{{content}}</mj-body></mjml>`;

// mailingBlocks may include { smartMjml } for smart blocks (already rendered before this call).
export function buildMailingMjml(layout, mailingBlocks) {
  const blocksMjml = mailingBlocks
    .map((mb) =>
      mb.smartMjml != null
        ? mb.smartMjml
        : injectContent(mb.blockMjml || mb.expand?.block?.mjml || "", mb.content ?? {})
    )
    .join("\n");

  const baseLayout = (layout || DEFAULT_LAYOUT).trim();

  if (baseLayout.includes("{{content}}")) {
    return baseLayout.replace("{{content}}", blocksMjml);
  }

  if (baseLayout.includes("</mj-body>")) {
    return baseLayout.replace("</mj-body>", blocksMjml + "\n</mj-body>");
  }

  // Last-resort fallback for malformed layouts.
  return DEFAULT_LAYOUT.replace("{{content}}", blocksMjml);
}
export function parseFieldsJson(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
