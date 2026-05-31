import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { useAppHeaderVisibility } from "../../hooks/useAppHeaderVisibility";

/**
 * Back button component for navigating to parent/list pages
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Click handler
 * @param {string} [props.ariaLabel="Terug"] - Accessible label for the button
 * @param {string} [props.className] - Additional classes to apply
 * @param {string} [props.size="normal"] - Size of the button ("small" or "normal")
 * @returns {JSX.Element} Back button component
 */
export const BackButton = ({ onClick, ariaLabel = "Terug", className = "", size = "normal" }) => {
  const { isAppHeaderHidden } = useAppHeaderVisibility();
  const iconSize = size === "small" ? "w-4 h-4" : "w-5 h-5";
  
  const buttonClasses = isAppHeaderHidden
    ? `p-3 bg-black/10 dark:bg-white/10 text-[var(--text-primary)] rounded-full backdrop-blur-md border border-black/10 dark:border-white/10 transition-all active:scale-[0.9] hover:bg-black/20 dark:hover:bg-white/20 ${className}`
    : `p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors ${className}`;
  
  // Add keyboard shortcut for Left Arrow key
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger if user is typing in an input field or textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      );
      
      if (event.key === "ArrowLeft" && !isTyping) {
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
      <ArrowLeftIcon className={iconSize} />
    </button>
  );
};