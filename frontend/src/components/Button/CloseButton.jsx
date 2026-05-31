import React, { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
/**
 * Close button component for consistent styling
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Click handler
 * @param {string} [props.ariaLabel="Sluiten"] - Accessible label for the button
 * @param {string} [props.className] - Additional classes to apply
 * @param {string} [props.size="small"] - Size of the button ("small" or "normal")
 * @returns {JSX.Element} Close button component
 */
export const CloseButton = ({ onClick, ariaLabel = "Sluiten", className = "", size = "small" }) => {
  const iconSize = size === "small" ? "w-4 h-4" : "w-5 h-5";
  
  const buttonClasses = `p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-border)] rounded-lg transition-colors ${className}`;
  
  // Add keyboard shortcut for Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClick();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClick]);
  
  return (
    <button
      onClick={onClick}
      className={buttonClasses}
      aria-label={ariaLabel}
    >
      <XMarkIcon className={iconSize} />
    </button>
  );
};