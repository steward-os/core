export const buildPocketBaseFilter = (baseFilters = [], columns = []) => {
  const filterConditions = [...baseFilters];
  
  columns.forEach(column => {
    if (column.filterable && column.filterValue) {
      if (column.field.startsWith("expand.")) {
        // Handle expanded fields like "expand.groups.name"
        const fieldPath = column.field.replace("expand.", "");
        filterConditions.push(`${fieldPath} ~ "${column.filterValue}"`);
      } else {
        filterConditions.push(`${column.field} ~ "${column.filterValue}"`);
      }
    }
  });
  
  return filterConditions.join(" && ");
};

export const confirmDelete = (message = "Weet je zeker dat je dit item wilt verwijderen?") => {
  return window.confirm(message);
};

export const buildDateTimeFilter = (filterType, fieldName = "date_time") => {
  const today = new Date().toISOString().split('T')[0] + "T00:00:00.000Z";
  
  switch (filterType) {
    case "future":
      return `${fieldName} >= "${today}"`;
    case "past":
      return `${fieldName} < "${today}"`;
    case "today":
      const endOfDay = new Date().toISOString().split('T')[0] + "T23:59:59.999Z";
      return `${fieldName} >= "${today}" && ${fieldName} <= "${endOfDay}"`;
    default:
      return "";
  }
};