import { Button } from "../../components/Button/Button";
import CenteredSpinner from "../../components/CenteredSpinner";
import DialogPanel from "../../components/Modal/DialogPanel";
import ActionDetailContent from "./ActionDetailContent";
import { useBsAction, useDeleteBsAction } from "../../hooks/crudResourceHooks";

/**
 * @param {boolean}   open
 * @param {Function}  onClose
 * @param {string}    id
 * @param {Function}  onEdit      — called when the edit button is clicked
 * @param {Function}  [onDelete]  — called after successful delete
 */
const ActionDetailModal = ({ open, onClose, id, onEdit, onDelete }) => {
  const deleteActionMutation = useDeleteBsAction();

  const { data: action, isLoading, error } = useBsAction(
    id,
    { expand: "assigned_to,tags" },
    { enabled: !!id && open },
  );

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze actie wilt verwijderen?")) return;
    try {
      await deleteActionMutation.mutateAsync(id);
      onClose();
      onDelete?.();
    } catch {
      alert("Er is een fout opgetreden bij het verwijderen van de actie.");
    }
  };

  return (
    <DialogPanel open={open} onClose={onClose} title={action?.name || "Actie"} fullscreenOnMobile>
      {isLoading && <CenteredSpinner />}
      {error && <p className="text-red-600 text-sm">Fout bij laden: {error.message}</p>}

      {action && <ActionDetailContent action={action} id={id} showCards />}

      {action && (
        <div className="flex gap-2 pt-2 sm:justify-end">
          <Button onClick={handleDelete} color="red" text="Verwijderen" className="flex-1 sm:flex-none px-4 py-2 font-medium rounded-lg" />
          <Button onClick={() => { onClose(); onEdit(id); }} color="blue" text="Bewerken" className="flex-1 sm:flex-none px-4 py-2 font-medium rounded-lg" />
        </div>
      )}
    </DialogPanel>
  );
};

export default ActionDetailModal;
