/** Pure helpers for the Berichten pages, kept apart so they can be tested. */

const dayMonth = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" });
const time = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit" });

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * When a message came in, as a mail app shows it: "14:32" today, "gisteren" yesterday, "8 okt" this
 * year, "8 okt 2025" before.
 */
export function formatRelativeDate(value, now = new Date()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return time.format(date);
  if (sameDay(date, yesterday)) return "gisteren";
  const format = date.getFullYear() === now.getFullYear() ? dayMonth : dayMonthYear;
  return format.format(date).replace(".", "");
}

/** The group a message went to, followed by its sections if it was narrowed to some: "Orkest · Trompet, Tuba". */
export function recipientsLabel(message) {
  const group = message.expand?.group?.name || "";
  const sections = (message.expand?.sections || []).map((section) => section.name).filter(Boolean);
  return sections.length > 0 ? `${group} · ${sections.join(", ")}` : group;
}

/**
 * The sections held by members of a group, for the section picker: [{ id, name: "Trompet (6)" }] by
 * name. Members without a section are left out; an empty list means the group has no sections.
 */
export function sectionOptions(memberships) {
  const sections = new Map();
  for (const membership of memberships) {
    const section = membership.expand?.section;
    if (!section) continue;
    const entry = sections.get(section.id) || { id: section.id, label: section.name, count: 0 };
    entry.count += 1;
    sections.set(section.id, entry);
  }
  return [...sections.values()]
    .sort((a, b) => a.label.localeCompare(b.label, "nl"))
    .map(({ id, label, count }) => ({ id, name: `${label} (${count})` }));
}

/** How many people a message reaches: everyone in the group, or only those in [sectionIds]. */
export function countRecipients(memberships, sectionIds = []) {
  const reached = sectionIds.length === 0 ? memberships : memberships.filter((m) => sectionIds.includes(m.section));
  return new Set(reached.map((m) => m.user)).size;
}

/**
 * The inbox filter for a user with [memberships]: per membership, messages to that group for everyone,
 * plus those narrowed to the member's section. Returns { expression, params } for pb.filter, or null
 * when the user is in no group and receives nothing.
 */
export function buildInboxFilter(memberships) {
  if (!memberships || memberships.length === 0) return null;
  const params = {};
  const clauses = memberships.map((membership, i) => {
    params[`group${i}`] = membership.group;
    if (!membership.section) return `(group = {:group${i}} && sections:length = 0)`;
    params[`section${i}`] = membership.section;
    return `(group = {:group${i}} && (sections:length = 0 || sections.id ?= {:section${i}}))`;
  });
  return { expression: clauses.join(" || "), params };
}

/** Same check as before: a video plays, anything else shows as a photo. */
export const isVideoFile = (filename) => /\.(mp4|webm|mov|avi)$/i.test(filename);

/** The texts to save: trimmed, without blank buttons, and every text only once. */
export function cleanReactionOptions(rows) {
  const texts = rows.map((row) => row.text.trim()).filter(Boolean);
  return [...new Set(texts)];
}

/**
 * Reaction buttons are edited like a poll's answers: rows with a stable key, plus an empty row (key
 * [newKey]) at the end. Typing there turns it into a button with that same key, so the input keeps the
 * cursor, and a fresh empty row appears.
 */
export function changeReactionRow({ rows, newKey, nextKey }, key, text) {
  if (key === newKey) {
    return { rows: [...rows, { key, text }], newKey: nextKey, nextKey: nextKey + 1 };
  }
  return { rows: rows.map((row) => (row.key === key ? { ...row, text } : row)), newKey, nextKey };
}

/** Rows with fresh keys for [texts], e.g. a preset or a saved message's buttons. */
export function reactionRowsFrom(texts) {
  const rows = texts.map((text, index) => ({ key: index + 1, text }));
  return { rows, newKey: rows.length + 1, nextKey: rows.length + 2 };
}

/** One-tap sets for the questions asked most. */
export const REACTION_PRESETS = [
  ["Ik kom", "Ik kom niet"],
  ["Ja", "Nee", "Misschien"],
];
