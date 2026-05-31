import { stateColors } from "../features/sessions/stateVars";

/**
 * Get Tailwind CSS classes for attendance state badges
 * @param {string} state - Attendance state from stateVars.js
 * @returns {string} Tailwind CSS classes for background and text color
 */
export const getStateColorClass = (state) => {
  const color = stateColors[state];
  switch (color) {
    case "green":
      return "bg-green-100 text-green-800";
    case "orange":
      return "bg-orange-100 text-orange-800";
    case "red":
      return "bg-red-100 text-red-800";
    case "blue":
      return "bg-blue-100 text-blue-800";
    case "purple":
      return "bg-purple-100 text-purple-800";
    case "yellow":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
