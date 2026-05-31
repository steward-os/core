import { XMarkIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAllTags } from "../../hooks/useRelationTagQuery";
import pb from "../../pb";

const TagSelector = ({
  type,
  item,
  field = "tags",
  availableTags: availableTagsProp = [],
  selectedTagIds: selectedTagIdsProp,
  onTagsChange,
  onCreateNew,
  onSearch,
  onSearchTermChange,
  inputValue,
  searchQuery,
  onClearSearch,
  placeholder = "Type om tags te zoeken...",
  createNewLabel = "Aanmaken:",
  className = "",
}) => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState(null);
  const [localSelectedIds, setLocalSelectedIds] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch tags internally when type is provided
  const { data: fetchedTags } = useAllTags(
    { filter: type ? `type = "${type}"` : undefined, sort: "name" },
    { enabled: !!type },
  );

  const availableTags = type ? fetchedTags || [] : availableTagsProp;

  // Initialize local selected IDs from item.tags or the prop
  useEffect(() => {
    if (item) {
      setLocalSelectedIds(item[field] || []);
    } else if (selectedTagIdsProp !== undefined) {
      setLocalSelectedIds(selectedTagIdsProp);
    }
  }, [item, field, selectedTagIdsProp]);

  const searchTerm = inputValue !== undefined ? inputValue : internalSearchTerm;
  const setSearchTerm = inputValue !== undefined ? (v) => onSearchTermChange?.(v) : setInternalSearchTerm;

  const selectedTagIds = localSelectedIds;

  const handleTagsChange = async (newIds) => {
    setLocalSelectedIds(newIds);
    onTagsChange?.(newIds);

    if (item) {
      try {
        await pb.collection(item.collectionName).update(item.id, { [field]: newIds });
        queryClient.invalidateQueries({ queryKey: ["tags", item.collectionName, item.id] });
      } catch (error) {
        console.error("Error updating tags:", error);
        setLocalSelectedIds(selectedTagIds); // revert on error
      }
    }
  };

  // Get selected tags objects
  const selectedTags = availableTags.filter((tag) => selectedTagIds.includes(tag.id));

  // Filter available tags based on search term and exclude already selected
  const filteredTags = availableTags.filter(
    (tag) =>
      !selectedTagIds.includes(tag.id) &&
      (tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.description?.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const inContainer = containerRef.current?.contains(event.target);
      const inDropdown = dropdownRef.current?.contains(event.target);
      if (!inContainer && !inDropdown) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        setFocusedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < filteredTags.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredTags.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && filteredTags[focusedIndex]) {
          handleTagSelect(filteredTags[focusedIndex]);
        } else if (onSearch && searchTerm.trim()) {
          onSearch(searchTerm.trim());
          setSearchTerm("");
          onSearchTermChange?.("");
          setIsOpen(false);
        } else if (searchTerm.trim() && filteredTags.length === 0) {
          if (onCreateNew) {
            handleCreateNew(searchTerm.trim());
          } else if (type) {
            handleCreateWithType(searchTerm.trim());
          }
        }
        break;
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleTagSelect = (tag) => {
    handleTagsChange([...selectedTagIds, tag.id]);
    setSearchTerm("");
    onSearchTermChange?.("");
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleTagRemove = (tagId) => {
    handleTagsChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const handleCreateWithType = async (term) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const newTag = await pb.collection("sys_tags").create({ name: term, type });
      queryClient.invalidateQueries({ queryKey: ["all-tags"] });
      setSearchTerm("");
      setFocusedIndex(-1);
      handleTagsChange([...selectedTagIds, newTag.id]);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error creating tag:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateNew = async (term) => {
    if (!onCreateNew || isCreating) return;
    setIsCreating(true);
    try {
      const newTag = await onCreateNew(term);
      setSearchTerm("");
      setFocusedIndex(-1);
      if (newTag?.id) {
        handleTagsChange([...selectedTagIds, newTag.id]);
      }
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error creating new item:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const dropdownEl =
    isOpen && dropdownPos && !(onSearch && filteredTags.length === 0)
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
          className="glass-panel rounded-2xl shadow-xl max-h-60 overflow-auto"
        >
          {filteredTags.length > 0 ? (
            <ul className="py-1">
              {filteredTags.map((tag, index) => (
                <li key={tag.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleTagSelect(tag);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${index === focusedIndex ? "bg-blue-100 dark:bg-blue-900" : ""
                      }`}
                  >
                    <div
                      className="w-3 h-3 rounded border border-gray-300 dark:border-gray-500 flex-shrink-0"
                      style={{ backgroundColor: tag.color || "#3B82F6" }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{tag.name}</div>
                      {tag.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{tag.description}</div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm && onCreateNew ? (
                <button
                  type="button"
                  disabled={isCreating}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCreateNew(searchTerm.trim());
                  }}
                  className="w-full text-left text-blue-600 hover:text-blue-800"
                >
                  {isCreating ? "Aanmaken..." : `${createNewLabel} "${searchTerm.trim()}"`}
                </button>
              ) : searchTerm && type ? (
                <button
                  type="button"
                  disabled={isCreating}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCreateWithType(searchTerm.trim());
                  }}
                  className="w-full text-left text-blue-600 hover:text-blue-800"
                >
                  {isCreating ? "Aanmaken..." : `${createNewLabel} "${searchTerm.trim()}"`}
                </button>
              ) : searchTerm ? (
                "Geen tags gevonden"
              ) : (
                "Geen tags beschikbaar"
              )}
            </div>
          )}
        </div>,
        document.body,
      )
      : null;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Combined tag chips + text input */}
      <div
        className="flex flex-wrap items-center gap-1 px-4 py-2 min-h-[44px] border border-gray-400 dark:border-gray-500 rounded-2xl shadow-sm bg-transparent backdrop-blur-sm focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 cursor-text transition-all"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0"
            style={{ backgroundColor: tag.color || "#3B82F6" }}
          >
            {tag.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleTagRemove(tag.id); }}
              className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${tag.name} tag`}
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
        {searchQuery && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 flex-shrink-0">
            {searchQuery}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClearSearch?.(); }}
              className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
              aria-label="Wis zoekterm"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          data-bwignore="true"
          data-lpignore="true"
          data-1p-ignore="true"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (inputValue === undefined) onSearchTermChange?.(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => {
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const openUpward = rect.top > window.innerHeight - rect.bottom;
              setDropdownPos(
                openUpward
                  ? { bottom: window.innerHeight - rect.top + 4, top: undefined, left: rect.left, width: rect.width }
                  : { top: rect.bottom + 4, bottom: undefined, left: rect.left, width: rect.width },
              );
            }
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[8rem] outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm py-0.5"
        />
      </div>
      {dropdownEl}
    </div>
  );
};

export default TagSelector;
