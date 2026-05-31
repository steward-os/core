import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useEffect, useState } from "react";
import pb from "../pb";

function GroupDropdown({ value, onChange }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    pb.collection("mb_groups")
      .getFullList()
      .then((data) => setOptions(data))
      .catch((err) => {
        console.error("Error fetching groups:", err);
        setOptions([])
      });
  }, []);

  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded w-35 text-left bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
        {value ? options.find((o) => o.id === value)?.name || "Kies groep" : "Kies groep"}
      </ListboxButton>
      <ListboxOptions anchor="bottom start" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50 [--anchor-gap:4px]">
        {options.map((option) => (
          <ListboxOption key={option.id} value={option.id} className="cursor-pointer px-3 py-2 text-gray-900 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-900">
            {option.name}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

export default GroupDropdown;
