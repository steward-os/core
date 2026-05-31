import { useEffect, useState } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import pb from "../pb";

function SectionDropdown({ value, onChange }) {
  const [options, setOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    pb.collection("mb_sections")
      .getFullList({
        sort: "name"
      })
      .then((data) => {
        setOptions(data);
        setFilteredOptions(data);
      })
      .catch((err) => {
        console.error("Error fetching sections:", err);
        setOptions([]);
        setFilteredOptions([]);
      });
  }, []);

  // Filter options when filterText changes
  useEffect(() => {
    if (!filterText) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.name.toLowerCase().startsWith(filterText.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [filterText, options]);

  // Handle keyboard input for filtering
  const handleKeyDown = (event) => {
    if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
      setFilterText(prev => prev + event.key);
      // Clear filter after 3 seconds
      setTimeout(() => setFilterText(""), 3000);
    } else if (event.key === "Backspace") {
      setFilterText(prev => prev.slice(0, -1));
    } else if (event.key === "Escape") {
      setFilterText("");
    }
  };

  return (
    <Listbox value={value} onChange={onChange}>
      <div onKeyDown={handleKeyDown}>
        <ListboxButton className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-left bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
          {value
            ? options.find((o) => o.id === value)?.name || "Kies sectie"
            : "Kies sectie"}
          {filterText && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({filterText})</span>
          )}
        </ListboxButton>
        <ListboxOptions anchor="bottom start" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50 w-48 [--anchor-gap:4px]">
          {filteredOptions.map((option) => (
            <ListboxOption
              key={option.id}
              value={option.id}
              className="cursor-pointer px-3 py-2 text-gray-900 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              {option.name}
            </ListboxOption>
          ))}
          {filteredOptions.length === 0 && filterText && (
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
              Geen secties gevonden voor "{filterText}"
            </div>
          )}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

export default SectionDropdown;
