import { Button } from "../../components/Button/Button";
import CenteredSpinner from "../../components/CenteredSpinner";
import DialogPanel from "../../components/Modal/DialogPanel";
import RelationDetailContent from "./RelationDetailContent";
import { useDeleteRelation, useRelation } from "../../hooks/crudResourceHooks";

/**
 * @param {boolean}   open
 * @param {Function}  onClose
 * @param {string}    id
 * @param {Function}  onEdit      — called when the edit button is clicked
 * @param {Function}  [onDelete]  — called after successful delete
 */
const RelationDetailModal = ({ open, onClose, id, onEdit, onDelete }) => {
  const deleteRelationMutation = useDeleteRelation();

  const { data: relation, isLoading, error } = useRelation(
    id,
    {},
    { enabled: !!id && open },
  );

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze relatie wilt verwijderen?")) return;
    try {
      await deleteRelationMutation.mutateAsync(id);
      onClose();
      onDelete?.();
    } catch {
      alert("Er is een fout opgetreden bij het verwijderen van de relatie.");
    }
  };

  const fullName = relation
    ? [relation.first_name, relation.last_name].filter(Boolean).join(" ") || "Relatie"
    : "Relatie";

  return (
    <DialogPanel open={open} onClose={onClose} title={fullName} fullscreenOnMobile>
      {isLoading && <CenteredSpinner />}
      {error && <p className="text-red-600 text-sm">Fout bij laden: {error.message}</p>}

      {relation && <RelationDetailContent relation={relation} id={id} />}

      {relation && (
        <div className="flex gap-2 pt-2 sm:justify-end">
          <Button onClick={handleDelete} color="red" text="Verwijderen" className="flex-1 sm:flex-none px-4 py-2 font-medium rounded-lg" />
          <Button onClick={() => { onClose(); onEdit(id); }} color="blue" text="Bewerken" className="flex-1 sm:flex-none px-4 py-2 font-medium rounded-lg" />
        </div>
      )}
    </DialogPanel>
  );
};

export default RelationDetailModal;
