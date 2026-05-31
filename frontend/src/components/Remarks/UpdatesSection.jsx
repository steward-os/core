import { useState } from "react";
import { useRemarksForEntity, useCreateRemark, useUpdateRemark, useDeleteRemark } from "../../hooks/useRemarksQuery";
import { formatDateTime } from "../../utils/dateTimeUtils";
import Label from "../Form/Label";
import Textarea from "../Form/Textarea";
import pb from "../../pb";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

/**
 * Reusable remarks section that can be attached to any entity
 * @param {Object} props
 * @param {string} props.entityType - The collection name (e.g., "bs_notes", "bs_meeting_topics")
 * @param {string} props.entityId - The entity ID
 * @param {string} props.title - Section title (default: "Opmerkingen")
 * @param {string} props.placeholder - Textarea placeholder
 * @param {boolean} props.allowCreate - Whether to show create form (default: true)
 * @param {boolean} props.allowEdit - Whether to allow editing own remarks (default: true)
 * @param {boolean} props.allowDelete - Whether to allow deleting own remarks (default: true)
 * @param {boolean} props.showCard - Whether to wrap in card on desktop (default: true)
 * @param {string} props.className - Additional CSS classes
 */
const UpdatesSection = ({
  entityType,
  entityId,
  title = "Opmerkingen",
  placeholder = "Type een opmerking...",
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  showCard = true,
  className = "",
}) => {
  const [newRemarkText, setNewRemarkText] = useState("");
  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const [editingRemarkText, setEditingRemarkText] = useState("");

  const {
    data: remarks = [],
    isLoading: remarksLoading,
    error: remarksError,
  } = useRemarksForEntity(entityType, entityId);
  const createRemarkMutation = useCreateRemark();
  const updateRemarkMutation = useUpdateRemark();
  const deleteRemarkMutation = useDeleteRemark();

  const handleCreateRemark = async (e) => {
    e.preventDefault();
    if (!newRemarkText.trim()) return;

    try {
      await createRemarkMutation.mutateAsync({
        entity_type: entityType,
        entity_id: entityId,
        content: newRemarkText.trim(),
        author: pb.authStore.record?.id,
      });
      setNewRemarkText("");
    } catch (error) {
      console.error("Error creating remark:", error);
      alert("Er is een fout opgetreden bij het toevoegen van de opmerking: " + (error.message || "Onbekende fout"));
    }
  };

  const handleEditRemark = (remark) => {
    setEditingRemarkId(remark.id);
    setEditingRemarkText(remark.update); // bs_updates uses 'update' field
  };

  const handleSaveEditRemark = async (remarkId) => {
    if (!editingRemarkText.trim()) return;

    try {
      await updateRemarkMutation.mutateAsync({
        id: remarkId,
        data: { update: editingRemarkText.trim() }, // bs_updates uses 'update' field
      });
      setEditingRemarkId(null);
      setEditingRemarkText("");
    } catch {
      alert("Er is een fout opgetreden bij het bewerken van de opmerking.");
    }
  };

  const handleCancelEditRemark = () => {
    setEditingRemarkId(null);
    setEditingRemarkText("");
  };

  const handleDeleteRemark = async (remarkId) => {
    if (!window.confirm("Weet je zeker dat je deze opmerking wilt verwijderen?")) return;

    try {
      await deleteRemarkMutation.mutateAsync(remarkId);
    } catch {
      alert("Er is een fout opgetreden bij het verwijderen van de opmerking.");
    }
  };

  const renderContent = () => (
    <>
      {title && <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{title}</h3>}

      {/* Add New Remark */}
      {allowCreate && (
        <form onSubmit={handleCreateRemark} className="mb-6">
          <div>
            <Label htmlFor={`newRemark-${entityType}-${entityId}`}>Nieuwe opmerking</Label>
            <div className="space-y-2">
              <Textarea
                id={`newRemark-${entityType}-${entityId}`}
                value={newRemarkText}
                onChange={(e) => setNewRemarkText(e.target.value)}
                placeholder={placeholder}
                disabled={createRemarkMutation.isPending}
                rows={3}
                autoGrow
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createRemarkMutation.isPending || !newRemarkText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Toevoegen
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Remarks List */}
      {remarksLoading ? (
        <div className="text-gray-500 dark:text-gray-400">Opmerkingen laden...</div>
      ) : remarksError ? (
        <div className="text-red-500">Fout bij laden opmerkingen: {remarksError.message}</div>
      ) : remarks.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">Nog geen opmerkingen</div>
      ) : (
        <div className="space-y-4">
          {remarks.map((remark) => {
            const isMyRemark = remark.author === pb.authStore.record?.id;
            const isEditing = editingRemarkId === remark.id;

            return (
              <div key={remark.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingRemarkText}
                          onChange={(e) => setEditingRemarkText(e.target.value)}
                          rows={3}
                          className="w-full"
                          autoGrow
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEditRemark(remark.id)}
                            disabled={updateRemarkMutation.isPending}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            OK
                          </button>
                          <button
                            onClick={handleCancelEditRemark}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{remark.update}</div>
                    )}
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {remark.expand?.author?.name || "Onbekend"} • {formatDateTime(remark.created)}
                    </div>
                  </div>
                  {isMyRemark && !isEditing && (allowEdit || allowDelete) && (
                    <div className="flex gap-2 ml-4">
                      {allowEdit && (
                        <button
                          onClick={() => handleEditRemark(remark)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Bewerken"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                      {allowDelete && (
                        <button
                          onClick={() => handleDeleteRemark(remark.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Verwijderen"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (!showCard) {
    return <div className={className}>{renderContent()}</div>;
  }

  return (
    <div className={className}>
      {/* Desktop: Card layout */}
      <div className="hidden md:block">
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          {renderContent()}
        </div>
      </div>

      {/* Mobile: No card layout */}
      <div className="md:hidden">{renderContent()}</div>
    </div>
  );
};

export default UpdatesSection;
