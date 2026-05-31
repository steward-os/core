import React from "react";

/**
 * Action button component for consistent styling
 * @param {Object} props - Component props
 * @param {string} props.title - Button text
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} [props.bg="bg-indigo-600"] - Background color class
 * @returns {JSX.Element} Action button component
 */
export const ActionButton = ({ title, onClick, disabled, bg = "bg-indigo-600" }) => (
  <button
    title={title}
    disabled={disabled}
    onClick={onClick}
    className={`px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white disabled:text-gray-500 dark:disabled:text-gray-400 ${bg} border border-gray-300 dark:border-gray-600 rounded-lg hover:opacity-90 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors`}
  >
    {title}
  </button>
);