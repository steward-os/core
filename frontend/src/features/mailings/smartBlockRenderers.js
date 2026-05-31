import renderUpcomingPerformances from "./smartBlocks/UpcomingPerformances";

export const SMART_RENDERERS = {
  UpcomingPerformances: renderUpcomingPerformances,
};

export const SMART_BLOCK_LABELS = {
  UpcomingPerformances: "Aankomende uitvoeringen",
};

export async function renderSmartBlock(smartType, params = {}) {
  const renderer = SMART_RENDERERS[smartType];
  if (!renderer) {
    return `
      <mj-section>
        <mj-column>
          <mj-text align="center" color="#b91c1c" font-size="14px">
            Onbekend smart block type: ${smartType || "(leeg)"}
          </mj-text>
        </mj-column>
      </mj-section>`;
  }
  return await renderer(params);
}

// Resolves the smart_type for a block definition.
// Tries the raw smart_type field first, then falls back to matching the block name
// against SMART_BLOCK_LABELS values (for blocks that predate the smart_type field).
export function resolveSmartType(blockDef) {
  const directType = blockDef?.smart_type?.trim();
  if (directType) {
    if (SMART_RENDERERS[directType]) return directType;
    // Handle legacy snake_case values (e.g. "upcoming_performances" → "UpcomingPerformances")
    const slug = directType.toLowerCase().replace(/_/g, "");
    const match = Object.keys(SMART_RENDERERS).find((key) => key.toLowerCase() === slug);
    if (match) return match;
  }

  const blockName = blockDef?.name?.trim().toLowerCase();
  if (!blockName) return "";

  const labelMatch = Object.entries(SMART_BLOCK_LABELS).find(
    ([, label]) => label.trim().toLowerCase() === blockName,
  );
  return labelMatch?.[0] ?? "";
}
