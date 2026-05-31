import { TrashIcon } from "@heroicons/react/24/outline";
import { destructiveIconButtonClasses } from "./iconButtonClasses";

/**
 * Delete button component for consistent styling
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Click handler
 * @param {string} [props.ariaLabel="Verwijderen"] - Accessible label for the button
 * @param {string} [props.className] - Additional classes to apply
 * @param {string} [props.size="small"] - Size of the button ("small" or "normal")
 * @param {boolean} [props.showText=false] - Whether to show text label alongside icon
 * @returns {JSX.Element} Delete button component
 */
export const DeleteButton = ({ onClick, ariaLabel = "Verwijderen", className = "", size = "small", showText = false }) => {
  const iconSize = size === "small" ? "w-4 h-4" : "w-5 h-5";

  const buttonClasses = destructiveIconButtonClasses(showText, className);

  return (
    <button
      onClick={onClick}
      className={buttonClasses}
      aria-label={ariaLabel}
      title={!showText ? ariaLabel : undefined}
    >
      <TrashIcon className={showText ? `${iconSize} mr-1` : iconSize} />
      {showText && "Delete"}
    </button>
  );
};