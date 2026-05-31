import { Button } from "../../components/Button/Button";
import CenteredSpinner from "../../components/CenteredSpinner";
import DialogPanel from "../../components/Modal/DialogPanel";
import ProjectDetailContent from "./ProjectDetailContent";
import { useDeleteProject, useProject } from "../../hooks/crudResourceHooks";

/**
 * @param {boolean}   open
 * @param {Function}  onClose
 * @param {string}    id
 * @param {Function}  onEdit      — called when the edit button is clicked
 * @param {Function}  [onDelete]  — called after successful delete
 */
const ProjectDetailModal = ({ open, onClose, id, onEdit, onDelete }) => {
  const deleteProjectMutation = useDeleteProject();

  const { data: project, isLoading, error } = useProject(
    id,
    {},
    { enabled: !!id && open },
  );

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je dit project wilt verwijderen?")) return;
    try {
      await deleteProjectMutation.mutateAsync(id);
      onClose();
      onDelete?.();
    } catch {
      alert("Er is een fout opgetreden bij het verwijderen van het project.");
    }
  };

  return (
    <DialogPanel open={open} onClose={onClose} title={project?.name || "Project"} fullscreenOnMobile>
      {isLoading && <CenteredSpinner />}
      {error && <p className="text-red-600 text-sm">Fout bij laden: {error.message}</p>}

      {project && <ProjectDetailContent project={project} id={id} />}

      {project && (
        <div className="flex gap-2 pt-2 sm:justify-end">
          <Button onClick={handleDelete} color="red" text="Verwijderen" className="flex-1 sm:flex-none px-4 py-2 font-medium rounded-lg" />
          <Button onClick={() => { onClose(); onEdit(id); }} color="blue" text="Bewerken" className="flex-1 sm:flex-none px-4 py-2 font-medium rounded-lg" />
        </div>
      )}
    </DialogPanel>
  );
};

export default ProjectDetailModal;
