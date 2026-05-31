import { formatDateTime } from "../../utils/dateTimeUtils";

export const getNestedValue = (obj, path) => {
  return path.split(".").reduce((current, key) => {
    if (key === "expand" && current) {
      return current.expand || current;
    }
    const direct = current?.[key];
    // If direct is a primitive (likely a PocketBase relation ID), prefer the expanded object
    if (direct != null && typeof direct !== "object") {
      return current?.expand?.[key] ?? direct;
    }
    return direct;
  }, obj);
};

export const getColumnContent = (column, item) => {
  if (typeof column.render === "function") return column.render(item);
  if (!column.field) return "";

  const value = getNestedValue(item, column.field);
  if (!value) return "-";

  if (column.field.includes("date_time") || column.field.includes("created") || column.field.includes("updated")) {
    try { return formatDateTime(value); } catch { return value; }
  }
  if (Array.isArray(value)) {
    return value.map((entry) => entry.name || entry).join(", ");
  }
  if (column.field.includes("groups") && typeof value === "object") {
    return Array.isArray(value) ? value.map((o) => o.name).join(", ") : value.name || value;
  }
  return value;
};
