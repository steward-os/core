import { useEffect, useState } from "react";
import { Button } from "../../components/Button/Button";
import FormFieldSelectAjax from "../../components/Form/FormFieldSelectAjax";
import Input from "../../components/Form/Input";
import Label from "../../components/Form/Label";
import Select from "../../components/Form/Select";
import TagSelector from "../../components/Form/TagSelector";
import Textarea from "../../components/Form/Textarea";
import DialogPanel from "../../components/Modal/DialogPanel";
import { useBsAction, useCreateBsAction, useUpdateBsAction } from "../../hooks/crudResourceHooks";

const EMPTY_FORM = {
  name: "",
  state: "open",
  description: "",
  assigned_to: "",
  tags: [],
  datetime: new Date().toISOString().slice(0, 10),
};

/**
 * @param {boolean}   open
 * @param {Function}  onClose
 * @param {string}    [id]       — omit for create mode
 * @param {Function}  [onSave]   — called with the saved record
 */
const ActionEditModal = ({ open, onClose, id, onSave }) => {
  const isCreateMode = !id;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const createActionMutation = useCreateBsAction();
  const updateActionMutation = useUpdateBsAction();

  const { data: action, isLoading } = useBsAction(
    id,
    { expand: "assigned_to,tags" },
    { enabled: !isCreateMode && open },
  );

  // Populate form when editing
  useEffect(() => {
    if (!isCreateMode && action) {
      setFormData({
        name: action.name || "",
        state: action.state || "open",
        description: action.description || "",
        assigned_to: action.assigned_to || "",
        tags: action.tags || [],
        datetime: action.datetime ? action.datetime.slice(0, 10) : new Date().toISOString().slice(0, 10),
      });
    }
  }, [action, isCreateMode]);

  // Reset form when opening in create mode
  useEffect(() => {
    if (open && isCreateMode) {
      setFormData(EMPTY_FORM);
    }
  }, [open, isCreateMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        state: formData.state,
        description: formData.description || null,
        assigned_to: formData.assigned_to || null,
        tags: formData.tags,
        datetime: formData.datetime || null,
      };
      let result;
      if (isCreateMode) {
        result = await createActionMutation.mutateAsync(data);
      } else {
        result = await updateActionMutation.mutateAsync({ id, data });
      }
      onSave?.(result);
      onClose();
    } catch (e) {
      console.error("Error saving action:", e);
      alert("Er is een fout opgetreden bij het opslaan van de actie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogPanel open={open} onClose={onClose} title={isCreateMode ? "Nieuwe actie" : "Actie bewerken"}>
      {!isCreateMode && isLoading ? (
        <div className="py-8 text-center text-gray-500">Laden...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ae-datetime">Datum</Label>
            <Input
              id="ae-datetime"
              type="date"
              value={formData.datetime}
              onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="ae-name" required>
              Naam
            </Label>
            <Input
              id="ae-name"
              placeholder="Naam van de actie"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="ae-state">Status</Label>
            <Select
              id="ae-state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            >
              <option value="open">Open</option>
              <option value="in_progress">In uitvoering</option>
              <option value="closed">Afgesloten</option>
            </Select>
          </div>

          <FormFieldSelectAjax
            name="assigned_to"
            label="Toegewezen aan"
            collection="users"
            query={{ sort: "name" }}
            searchFields={["name"]}
            optionDisplay="name"
            formData={formData}
            setFormData={setFormData}
            placeholder="Zoek gebruiker..."
          />

          <div>
            <Label htmlFor="ae-description">Beschrijving</Label>
            <Textarea
              id="ae-description"
              placeholder="Optionele beschrijving"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Tags</Label>
            <TagSelector
              type="action"
              selectedTagIds={formData.tags}
              onTagsChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
              placeholder="Type om tags te zoeken..."
            />
          </div>

          <div className="flex gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              onClick={onClose}
              color="gray"
              text="Annuleren"
              className="flex-1 sm:flex-none px-4 py-2 font-medium rounded-lg"
            />
            <Button
              type="submit"
              disabled={saving || !formData.name.trim()}
              color="blue"
              text={saving ? "Opslaan..." : "Opslaan"}
              className="flex-1 sm:flex-none px-4 py-2 font-medium rounded-lg"
            />
          </div>
        </form>
      )}
    </DialogPanel>
  );
};

export default ActionEditModal;
