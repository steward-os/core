import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { neutralIconButtonClasses } from "./iconButtonClasses";

/**
 * Duplicate button component for consistent styling
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Click handler
 * @param {string} [props.ariaLabel="Dupliceren"] - Accessible label for the button
 * @param {string} [props.className] - Additional classes to apply
 * @param {string} [props.size="small"] - Size of the button ("small" or "normal")
 * @returns {JSX.Element} Duplicate button component
 */
export const DuplicateButton = ({ onClick, ariaLabel = "Dupliceren", className = "", size = "small", showText = false }) => {
  const iconSize = size === "small" ? "w-4 h-4" : "w-5 h-5";

  const buttonClasses = neutralIconButtonClasses(showText, className);

  return (
    <button
      onClick={onClick}
      className={buttonClasses}
      aria-label={ariaLabel}
      title={!showText ? ariaLabel : undefined}
    >
      <DocumentDuplicateIcon className={showText ? `${iconSize} mr-1` : iconSize} />
      {showText && "Dupliceer"}
    </button>
  );
};