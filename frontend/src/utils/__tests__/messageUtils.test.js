import { describe, expect, it } from "vitest";
import {
  changeReactionRow,
  cleanReactionOptions,
  formatRelativeDate,
  isVideoFile,
  reactionRowsFrom,
  recipientsLabel,
} from "../messageUtils";

describe("messageUtils", () => {
  describe("formatRelativeDate", () => {
    const now = new Date(2026, 9, 10, 20, 0);

    it("reads like a mail app", () => {
      expect(formatRelativeDate(new Date(2026, 9, 10, 18, 15), now)).toBe("18:15");
      expect(formatRelativeDate(new Date(2026, 9, 9, 18, 15), now)).toBe("gisteren");
      expect(formatRelativeDate(new Date(2026, 9, 8, 18, 15), now)).toBe("8 okt");
      expect(formatRelativeDate(new Date(2025, 11, 12, 18, 15), now)).toBe("12 dec 2025");
    });

    it("handles empty and invalid values", () => {
      expect(formatRelativeDate(null, now)).toBe("");
      expect(formatRelativeDate("nope", now)).toBe("");
    });
  });

  it("names the groups or everybody", () => {
    expect(recipientsLabel({ expand: { groups: [{ name: "Harmonie" }, { name: "Slagwerk" }] } })).toBe("Harmonie, Slagwerk");
    expect(recipientsLabel({})).toBe("Alle gebruikers");
  });

  it("recognises videos", () => {
    expect(isVideoFile("clip.MP4")).toBe(true);
    expect(isVideoFile("foto.jpg")).toBe(false);
  });

  describe("reaction rows", () => {
    it("typing in the empty row adds a button that keeps its key", () => {
      let state = reactionRowsFrom([]);
      const firstKey = state.newKey;
      state = changeReactionRow(state, firstKey, "J");
      state = changeReactionRow(state, firstKey, "Ja");
      state = changeReactionRow(state, state.newKey, "Nee");

      expect(state.rows.map((row) => row.text)).toEqual(["Ja", "Nee"]);
      expect(state.rows[0].key).toBe(firstKey);
      expect(state.rows.map((row) => row.key)).not.toContain(state.newKey);
    });

    it("saves no blank or double buttons", () => {
      const rows = [{ key: 1, text: "Ja" }, { key: 2, text: " " }, { key: 3, text: "Ja " }, { key: 4, text: "Nee" }];
      expect(cleanReactionOptions(rows)).toEqual(["Ja", "Nee"]);
    });

    it("starts from saved buttons with unique keys", () => {
      const state = reactionRowsFrom(["Ik kom", "Ik kom niet"]);
      const keys = [...state.rows.map((row) => row.key), state.newKey];
      expect(new Set(keys).size).toBe(3);
    });
  });
});
