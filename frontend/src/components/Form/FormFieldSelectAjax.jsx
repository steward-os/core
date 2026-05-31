import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import pb from "../../pb";

/**
 * Searchable select with real server-side search (debounced).
 *
 * @param {string}   name           - formData key
 * @param {string}   [label]        - visible label above the input
 * @param {string}   collection     - PocketBase collection name
 * @param {Object}   [query]        - base query options (sort, expand, filter, …)
 * @param {string[]} [searchFields] - fields to search, e.g. ["first_name","last_name"]
 *                                    generates: first_name ~ "term" || last_name ~ "term"
 * @param {Function} [searchFilter] - custom filter fn (term) => string, overrides searchFields
 * @param {string|Function} [optionDisplay] - field name string OR (option) => string
 * @param {number}   [debounceMs]   - search debounce delay (default 300)
 * @param {Object}   formData
 * @param {Function} setFormData
 * @param {string}   [placeholder]
 * @param {boolean}  [disabled]
 * @param {Function} [onChange]     - called after selection: ({ target: { name, value } })
 * @param {Function} [create]      - (searchTerm) => record | void. When provided and no results,
 *                                   a "Create" button appears. If the function returns a record
 *                                   with an id, it is auto-selected.
 */
const FormFieldSelectAjax = ({
  name,
  label,
  collection,
  query = {},
  searchFields = [],
  searchFilter = null,
  optionDisplay = "name",
  debounceMs = 300,
  formData,
  setFormData,
  placeholder = "Zoeken...",
  disabled = false,
  onChange,
  onSearchTermChange,
  create,
  resetSignal,
  className = "relative",
}) => {
  const getLabel = useCallback(
    (option) => (typeof optionDisplay === "function" ? optionDisplay(option) : option[optionDisplay]),
    [optionDisplay]
  );

  const buildFilter = useCallback(
    (term) => {
      const base = query.filter || "";
      if (!term) return base;
      const termFilter = searchFilter
        ? searchFilter(term)
        : searchFields.map((f) => `${f} ~ "${term.replace(/"/g, "")}"`).join(" || ");
      if (!termFilter) return base;
      return base ? `(${base}) && (${termFilter})` : termFilter;
    },
    [query.filter, searchFilter, searchFields]
  );

  const [options, setOptions] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [dropdownPos, setDropdownPos] = useState(null);

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  const fetchOptions = useCallback(
    async (term) => {
      if (!collection) return;
      setLoading(true);
      try {
        const filter = buildFilter(term);
        const { sort, expand } = query;
        const records = await pb.collection(collection).getList(1, 20, {
          ...(sort ? { sort } : {}),
          ...(expand ? { expand } : {}),
          ...(filter ? { filter } : {}),
          requestKey: null,
        });
        setOptions(records.items);
      } catch (err) {
        if (!err?.message?.includes("autocancelled")) {
          console.error("FormFieldSelectAjax search error:", err);
        }
      } finally {
        setLoading(false);
      }
    },
    [collection, buildFilter, query]
  );

  // When the stored value changes, fetch that record to display its label
  const selectedValue = formData[name];
  useEffect(() => {
    if (!selectedValue) {
      setSelectedOption(null);
      setSearchTerm("");
      return;
    }
    let cancelled = false;
    pb.collection(collection)
      .getOne(selectedValue, { requestKey: null })
      .then((record) => {
        if (!cancelled) {
          setSelectedOption(record);
          setSearchTerm(getLabel(record));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedValue, collection, getLabel]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const inputRect = inputRef.current?.getBoundingClientRect() ?? rect;
      const openUpward = inputRect.top > window.innerHeight - inputRect.bottom;
      setDropdownPos(
        openUpward
          ? { bottom: window.innerHeight - inputRect.top + 4, top: undefined, left: rect.left, width: rect.width }
          : { top: inputRect.bottom + 4, bottom: undefined, left: rect.left, width: rect.width }
      );
    }
    setIsOpen(true);
    fetchOptions(searchTerm);
  }, [disabled, fetchOptions, searchTerm]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    // Restore display text to match actual selection
    if (selectedOption) {
      setSearchTerm(getLabel(selectedOption));
    } else {
      setSearchTerm("");
    }
  }, [selectedOption, getLabel]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearchTermChange) onSearchTermChange(value);
    if (!isOpen) setIsOpen(true);
    if (selectedOption && value !== getLabel(selectedOption)) {
      setSelectedOption(null);
    }
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchOptions(value), debounceMs);
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setSearchTerm(getLabel(option));
    setFormData({ ...formData, [name]: option.id });
    setIsOpen(false);
    if (onChange) onChange({ target: { name, value: option.id } });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!create) return;
    setCreating(true);
    try {
      const newRecord = await create(searchTerm);
      if (newRecord?.id) {
        handleOptionSelect(newRecord);
      } else {
        setIsOpen(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedOption(null);
    setSearchTerm("");
    setOptions([]);
    setFormData({ ...formData, [name]: "" });
  };

  // Close on outside click (check both container and portal dropdown)
  useEffect(() => {
    const handleMouseDown = (e) => {
      const inContainer = containerRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inContainer && !inDropdown) closeDropdown();
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [closeDropdown]);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  useEffect(() => {
    if (resetSignal === undefined) return;
    setIsOpen(false);
    setSelectedOption(null);
    setSearchTerm("");
  }, [resetSignal]);

  const dropdownEl = isOpen && dropdownPos
    ? createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: dropdownPos.top,
            bottom: dropdownPos.bottom,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
          }}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {loading && <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Laden...</div>}
          {!loading && options.length === 0 && !create && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Geen resultaten</div>
          )}
          {!loading && options.length === 0 && create && (
            <button
              type="button"
              onMouseDown={handleCreate}
              disabled={creating}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {creating ? "Aanmaken..." : `"${searchTerm}" aanmaken`}
            </button>
          )}
          {!loading &&
            options.map((option) => (
              <div
                key={option.id}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before selection
                  handleOptionSelect(option);
                }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  selectedOption?.id === option.id
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {getLabel(option)}
              </div>
            ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className={className}>
      {label && (
        <label htmlFor={name} className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={openDropdown}
          onBlur={closeDropdown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-0.5">
          {selectedValue && !disabled && (
            <button type="button" onMouseDown={handleClear} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <ChevronDownIcon className="w-4 h-4 text-gray-400 pointer-events-none mr-0.5" />
        </div>
      </div>
      {dropdownEl}
    </div>
  );
};

export default FormFieldSelectAjax;
