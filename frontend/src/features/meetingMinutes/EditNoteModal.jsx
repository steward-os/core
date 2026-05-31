import { SparklesIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/Button/Button";
import Input from "../../components/Form/Input";
import Label from "../../components/Form/Label";
import Select from "../../components/Form/Select";
import Textarea from "../../components/Form/Textarea";
import DialogPanel from "../../components/Modal/DialogPanel";
import { noteSchema } from "../../schemas/noteSchema";
import { updateMinute } from "../../services/notesService";
import { getUsers } from "../../services/userService";
import { getProjects } from "../../services/projectService";
import { improveMinuteText } from "../../utils/geminiUtils";

const EditNoteModal = React.memo(({ open, onClose, minute, onSave, type = null, projectId = null }) => {
  const [saving, setSaving] = useState(false);
  const [improving, setImproving] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const form = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      name: "",
      type: type || "",
      state: "open",
      description: "",
      assigned_to: "",
      project: projectId || "",
    },
  });

  const typeOptions = [
    { id: "note", name: "Notitie" },
    { id: "action", name: "Actie" },
    { id: "decision", name: "Besluit" },
  ];

  const stateOptions = [
    { id: "open", name: "Open" },
    { id: "in_progress", name: "In uitvoering" },
    { id: "closed", name: "Gesloten" },
  ];

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchProjects();
    }
  }, [open]);

  useEffect(() => {
    if (minute && open) {
      form.reset({
        name: minute.name || "",
        type: minute.type || type || "",
        state: minute.state || "open",
        description: minute.description || "",
        assigned_to: minute.assigned_to || "",
        project: minute.project || projectId || "",
      });
    } else if (open && !minute) {
      // Reset form for new items
      form.reset({
        name: "",
        type: type || "",
        state: "open",
        description: "",
        assigned_to: "",
        project: projectId || "",
      });
    }
  }, [minute, open, type, form, projectId]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersData = await getUsers({
        sort: "name",
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
    setLoadingUsers(false);
  };

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const projectsData = await getProjects({
        sort: "name",
      });
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    }
    setLoadingProjects(false);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const submitData = {
        name: data.name.trim(),
        type: data.type,
        state: data.state,
        description: data.description?.trim() || "",
        assigned_to: data.assigned_to || null,
        project: data.project || null,
      };

      if (minute?.id) {
        // Update existing minute
        await updateMinute(minute.id, submitData);
      } else {
        // Create new minute - we'll need to import createMinute
        const { createMinute } = await import("../../services/notesService");
        await createMinute(submitData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving minute:", error);
    }
    setSaving(false);
  };

  const getTitle = () => {
    if (minute?.id) {
      return type === "action" ? "Taak bewerken" : "Notitie bewerken";
    } else {
      return type === "action" ? "Nieuwe taak" : "Nieuwe notitie";
    }
  };

  const getPlaceholder = () => {
    return type === "action" ? "Titel van de taak" : "Nieuwe notitie";
  };

  return (
    <DialogPanel open={open} onClose={onClose} title={getTitle()}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="name" required className="mb-0">
              Notitie
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={improving}
                onClick={async () => {
                  const current = form.getValues("name");
                  if (!current.trim()) return;
                  setImproving(true);
                  try {
                    const improved = await improveMinuteText(current);
                    form.setValue("name", improved, { shouldDirty: true });
                  } catch (err) {
                    alert(`Verbeteren mislukt: ${err.message}`);
                  } finally {
                    setImproving(false);
                  }
                }}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                {improving ? "Bezig..." : "Verbeter met AI"}
              </button>
            </div>
          </div>
          <Textarea
            id="name"
            {...form.register("name")}
            placeholder={getPlaceholder()}
            error={form.formState.errors.name?.message}
          />
        </div>

        {!type && (
          <div>
            <Label htmlFor="type" required>
              Type
            </Label>
            <Select id="type" {...form.register("type")} error={form.formState.errors.type?.message}>
              <option value="">Selecteer type</option>
              {typeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="state" required>
            Status
          </Label>
          <Select id="state" {...form.register("state")} error={form.formState.errors.state?.message}>
            {stateOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </div>

        {form.watch("type") === "action" && (
          <div>
            <Label htmlFor="assigned_to">Toegewezen aan</Label>
            <Select
              id="assigned_to"
              {...form.register("assigned_to")}
              disabled={loadingUsers}
              error={form.formState.errors.assigned_to?.message}
            >
              <option value="">Niet toegewezen (optioneel)</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
            {loadingUsers && <p className=" text-gray-500 mt-1">Gebruikers laden...</p>}
          </div>
        )}

        <div>
          <Label htmlFor="project">Project</Label>
          <Select
            id="project"
            {...form.register("project")}
            disabled={loadingProjects}
            error={form.formState.errors.project?.message}
          >
            <option value="">Geen project (optioneel)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          {loadingProjects && <p className=" text-gray-500 mt-1">Projecten laden...</p>}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            onClick={onClose}
            color="gray"
            text="Annuleren"
            className="flex-1 px-4 py-2  font-medium rounded-lg"
          />
          <Button
            type="submit"
            disabled={saving || form.formState.isSubmitting}
            color="blue"
            text={saving ? "Opslaan..." : "Opslaan"}
            className="flex-1 px-4 py-2  font-medium rounded-lg"
          />
        </div>
      </form>
    </DialogPanel>
  );
});

export default EditNoteModal;
