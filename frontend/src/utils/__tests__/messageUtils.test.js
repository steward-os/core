import { describe, expect, it } from "vitest";
import {
  buildInboxFilter,
  changeReactionRow,
  cleanReactionOptions,
  countRecipients,
  formatRelativeDate,
  isVideoFile,
  reactionRowsFrom,
  recipientsLabel,
  sectionOptions,
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

  describe("recipientsLabel", () => {
    it("names the group", () => {
      expect(recipientsLabel({ expand: { group: { name: "Orkest" } } })).toBe("Orkest");
      expect(recipientsLabel({ expand: { group: { name: "Orkest" }, sections: [] } })).toBe("Orkest");
    });

    it("adds the sections the message was narrowed to", () => {
      const message = { expand: { group: { name: "Orkest" }, sections: [{ name: "Trompet" }, { name: "Bugel 1" }] } };
      expect(recipientsLabel(message)).toBe("Orkest · Trompet, Bugel 1");
    });
  });

  describe("message targeting", () => {
    const trompet = { id: "s-trompet", name: "Trompet" };
    const tuba = { id: "s-tuba", name: "Tuba" };
    const member = (user, section) => ({ user, group: "g-orkest", section: section?.id || "", expand: section ? { section } : {} });
    const orkest = [member("u1", trompet), member("u2", trompet), member("u3", tuba), member("u4")];

    it("offers the sections in the group with their counts, by name", () => {
      expect(sectionOptions(orkest)).toEqual([
        { id: "s-trompet", name: "Trompet (2)" },
        { id: "s-tuba", name: "Tuba (1)" },
      ]);
    });

    it("offers nothing for a group without sections", () => {
      expect(sectionOptions([member("u1"), member("u2")])).toEqual([]);
    });

    it("counts everyone when no sections are chosen", () => {
      expect(countRecipients(orkest)).toBe(4);
      expect(countRecipients(orkest, [])).toBe(4);
    });

    it("counts only the chosen sections, leaving out members without one", () => {
      expect(countRecipients(orkest, ["s-trompet"])).toBe(2);
      expect(countRecipients(orkest, ["s-trompet", "s-tuba"])).toBe(3);
    });
  });

  describe("buildInboxFilter", () => {
    it("receives nothing without memberships", () => {
      expect(buildInboxFilter([])).toBeNull();
      expect(buildInboxFilter(undefined)).toBeNull();
    });

    it("with a section: messages to everyone and to that section", () => {
      expect(buildInboxFilter([{ group: "g1", section: "s1" }])).toEqual({
        expression: "(group = {:group0} && (sections:length = 0 || sections.id ?= {:section0}))",
        params: { group0: "g1", section0: "s1" },
      });
    });

    it("without a section: only messages to everyone", () => {
      expect(buildInboxFilter([{ group: "g1", section: "" }])).toEqual({
        expression: "(group = {:group0} && sections:length = 0)",
        params: { group0: "g1" },
      });
    });

    it("one clause per membership", () => {
      const filter = buildInboxFilter([{ group: "g1", section: "s1" }, { group: "g2", section: "" }]);
      expect(filter.expression).toBe(
        "(group = {:group0} && (sections:length = 0 || sections.id ?= {:section0})) || (group = {:group1} && sections:length = 0)",
      );
      expect(filter.params).toEqual({ group0: "g1", section0: "s1", group1: "g2" });
    });
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
