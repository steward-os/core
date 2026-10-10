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

/** The groups a message went to, or "Alle gebruikers" for old messages without groups. */
export function recipientsLabel(message) {
  const names = (message.expand?.groups || []).map((group) => group.name).filter(Boolean);
  return names.length > 0 ? names.join(", ") : "Alle gebruikers";
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
