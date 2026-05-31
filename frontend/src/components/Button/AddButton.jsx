import { PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
    <>
      {/* Desktop: inline in parent layout */}
      <button
        onClick={onClick}
        className={`hidden md:block p-2 px-4 bg-blue-600/20 text-blue-400 rounded-full backdrop-blur-md border border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-500/30 transition-all duration-300 active:scale-95 ${className}`}
        aria-label={ariaLabel}
      >
        <span className="flex items-center gap-1">
          <PlusIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Nieuw</span>
        </span>
      </button>
      {/* Mobile: portal to document.body so backdrop-filter ancestors don't trap fixed positioning */}
      {createPortal(
        <button
          onClick={onClick}
          className="md:hidden fixed bottom-28 right-4 z-50 shadow-md shadow-blue-600/20 p-4 bg-blue-600/20 text-blue-400 rounded-full backdrop-blur-md border border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-500/30 transition-all duration-300 active:scale-95"
          aria-label={ariaLabel}
        >
          <span className="flex items-center gap-1">
            <PlusIcon className="w-5 h-5" />
            <span className={`overflow-hidden transition-all duration-200 text-sm font-medium ${scrolled ? "w-0 opacity-0" : "w-auto opacity-100 pr-1"}`}>
              Nieuw
            </span>
          </span>
        </button>,
        document.body
      )}
    </>
  );
};

AddButton.isAddButton = true;
