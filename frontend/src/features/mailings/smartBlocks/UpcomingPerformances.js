import dayjs from "dayjs";
import pb from "../../../pb";

function groupNames(s) {
  const groups = s.expand?.groups;
  if (!groups?.length) return "";
  return Array.isArray(groups) ? groups.map((g) => g.name).join(", ") : groups.name;
}

function renderPerformanceColumn(s) {
  const date = dayjs(s.date_time).format("DD/MM/YYYY");
  const time = dayjs(s.date_time).format("HH:mm");
  const location = s.location || "—";
  const groups = groupNames(s);

  return `
      <mj-column padding="0 8px">
        <mj-text font-size="15px" font-weight="bold" color="#1e3776" padding-bottom="4px" padding-top="0">
          ${s.name}
        </mj-text>
        ${
          groups
            ? `
        <mj-text font-size="13px" color="#374151" padding="2px 0">
          🎵 ${groups}
        </mj-text>`
            : ""
        }
        <mj-text font-size="13px" color="#374151" padding="2px 0">
          📅 ${date}
        </mj-text>
        <mj-text font-size="13px" color="#374151" padding="2px 0">
          🕐 ${time}
        </mj-text>
        <mj-text font-size="13px" color="#374151" padding="2px 0">
          📍 ${location}
        </mj-text>
      </mj-column>`;
}

function renderEmptyColumn() {
  return `<mj-column padding="0 8px"></mj-column>`;
}

export default async function renderUpcomingPerformances(params = {}) {
  const parsedLimit = Number(params.limit);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 6;

  let result;
  try {
    result = await pb.collection("mb_sessions").getList(1, limit, {
      filter: "type = 'performance' && date_time >= @now",
      sort: "date_time",
      expand: "groups",
    });
  } catch (error) {
    return `
      <mj-section>
        <mj-column>
          <mj-text align="center" color="#b91c1c" font-size="14px">
            Blok kon niet laden: ${error?.message || "onbekende fout"}
          </mj-text>
        </mj-column>
      </mj-section>`;
  }

  if (!result?.items?.length) {
    return `
      <mj-section>
        <mj-column>
          <mj-text align="center" color="#6b7280" font-size="14px">
            Geen aankomende uitvoeringen gevonden.
          </mj-text>
        </mj-column>
      </mj-section>`;
  }

  const title = params.title ?? "Programma";
  const headerColor = params.header_color ?? "#1e3776";
  const debugMarker = params.debug_marker ?? "SMARTBLOCK_RENDERED";

  const rows = [];
  const items = result.items;
  for (let i = 0; i < items.length; i += 2) {
    rows.push(`
    <mj-section padding="8px 0">
      ${renderPerformanceColumn(items[i])}
      ${items[i + 1] ? renderPerformanceColumn(items[i + 1]) : renderEmptyColumn()}
    </mj-section>`);
  }

  return `
  <mj-spacer height="20px" />  
  <mj-section padding="0" background-color="${headerColor}">
      <mj-column padding="12px 16px">
        <mj-text color="#ffffff" padding="0">
            <h2 style="margin:0; font-size:24px; font-family: 'Arial Black';">${title}</h2>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0">
      <mj-column padding="0">
        <mj-divider border-color="#d1d5db" border-width="1px" padding="0" />
      </mj-column>
    </mj-section>
    ${rows.join("\n")}`;
}
