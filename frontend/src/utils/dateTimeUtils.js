export function formatDateTime(dateString, includeYear = true) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const datePart = date.toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: includeYear ? "2-digit" : undefined,
  });
  const timePart = date.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${datePart} ${timePart}`;
}
