import { useState } from "react";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

const InlineEditableNumber = ({ value, onSave, placeholder = "Geen waarde", min, max }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setEditValue(value?.toString() || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const numberValue = editValue === "" ? null : parseInt(editValue, 10);
      await onSave(numberValue);
      setIsEditing(false);
      setEditValue("");
    } catch (error) {
      console.error("Error saving value:", error);
      alert("Er is een fout opgetreden bij het opslaan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          disabled={isSaving}
          autoFocus
          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Opslaan"
        >
          <CheckIcon className="w-5 h-5" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Annuleren"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-gray-900 dark:text-gray-100">{value ?? placeholder}</span>
      <button
        onClick={handleEdit}
        className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Bewerken"
      >
        <PencilIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default InlineEditableNumber;
