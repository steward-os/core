import { PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import pb from "../pb";

const InlineTagEditor = ({ item, availableTags = [], field = "tags" }) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPos, setDropdownPos] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedTagIds = item[field] || [];
  const selectedTags = item.expand?.[field] || [];

  const filteredTags = (availableTags || []).filter(
    (tag) =>
      tag &&
      tag.id &&
      !selectedTagIds.includes(tag.id) &&
      (tag.name || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateDropdownPos = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 200),
      });
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      updateDropdownPos();
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearchTerm("");
    }
  };

  const handleAddTag = async (tagId) => {
    const newIds = [...selectedTagIds, tagId];
    try {
      // Use "bs_correspondence" directly if collectionName is missing, 
      // but it should be there for PocketBase records.
      const collectionName = item.collectionName || "bs_correspondence";
      await pb.collection(collectionName).update(item.id, { [field]: newIds });
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      setSearchTerm("");
      setIsOpen(false);
    } catch (err) {
      console.error("Fout bij toevoegen tag:", err);
    }
  };

  const handleRemoveTag = async (e, tagId) => {
    e.stopPropagation();
    const newIds = selectedTagIds.filter((id) => id !== tagId);
    try {
      const collectionName = item.collectionName || "bs_correspondence";
      await pb.collection(collectionName).update(item.id, { [field]: newIds });
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    } catch (err) {
      console.error("Fout bij verwijderen tag:", err);
    }
  };

  const dropdownContent = isOpen && dropdownPos && (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        minWidth: dropdownPos.width,
        zIndex: 9999,
      }}
      className="glass-panel shadow-xl rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b border-gray-100 dark:border-white/5">
        <input
          ref={inputRef}
          type="text"
          className="w-full text-xs bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-400"
          placeholder="Zoek tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
        />
      </div>
      <div className="max-h-40 overflow-y-auto">
        {availableTags === undefined ? (
          <div className="px-3 py-2 text-xs text-gray-500 italic">Laden...</div>
        ) : filteredTags.length > 0 ? (
          filteredTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleAddTag(tag.id)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color || "#6b7280" }}
              />
              <span className="truncate">{tag.name || "Naamloze tag"}</span>
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-xs text-gray-500 italic">
            {searchTerm ? "Geen tags gevonden" : "Geen tags beschikbaar"}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="relative inline-flex flex-wrap gap-1 items-center"
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
    >
      {selectedTags.map((tag) => (
        <span
          key={tag.id}
          className="group inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full text-white cursor-default"
          style={{ backgroundColor: tag.color || "#6b7280" }}
        >
          {tag.name}
          <button
            onClick={(e) => handleRemoveTag(e, tag.id)}
            className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
          >
            <XMarkIcon className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        onClick={handleToggle}
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
        title="Tag toevoegen"
      >
        <PlusIcon className="w-4 h-4" />
      </button>

      {isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default InlineTagEditor;
