import { useEffect, useRef, useState } from "react";

const FilterPopup = ({ isOpen, onClose, fieldLabel, fieldName, initialValue = "", onApply }) => {
  const [value, setValue] = useState(initialValue || "");
  const popupRef = useRef(null);
  const inputRef = useRef(null);

  // Reset value when popup opens
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue || "");
      // Focus input on next tick
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen, initialValue]);

  // Handle clicks outside popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleApply = () => {
    onApply(value, fieldName);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApply();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm">
      <div ref={popupRef} className="glass-panel p-6 w-80 max-w-[90%] rounded-2xl shadow-2xl">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Filter op {fieldLabel}</label>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-primary)] transition-all"
            placeholder={`Voer ${fieldLabel.toLowerCase()} in...`}
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setValue("");
              onApply("", fieldName);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
          >
            Wissen
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            Toepassen
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPopup;