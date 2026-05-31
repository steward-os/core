import { PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

/**
 * Add button component for consistent styling
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Click handler
 * @param {string} [props.ariaLabel="Toevoegen"] - Accessible label for the button
 * @param {string} [props.className] - Additional classes to apply
 * @returns {JSX.Element} Add button component
 */
export const AddButton = ({ onClick, ariaLabel = "Toevoegen", className = "" }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "+") {
        event.preventDefault();
        onClick();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClick]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      onClick={onClick}
      className={`max-md:fixed max-md:bottom-28 max-md:right-4 max-md:z-50 max-md:shadow-md max-md:shadow-blue-600/20 p-4 md:p-2 md:px-4 bg-blue-600/20 text-blue-400 rounded-full backdrop-blur-md border border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-500/30 transition-all duration-300 active:scale-95 ${className}`}
      aria-label={ariaLabel}
    >
      <span className="flex items-center gap-1">
        <PlusIcon className="w-5 h-5" />
        <span className={`max-md:overflow-hidden max-md:transition-all max-md:duration-200 text-sm font-medium ${scrolled ? "max-md:w-0 max-md:opacity-0" : "max-md:w-auto max-md:opacity-100 max-md:pr-1"}`}>
          Nieuw
        </span>
      </span>
    </button>
  );
};

AddButton.isAddButton = true;
