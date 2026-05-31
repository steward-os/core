import { useState } from "react";
import { Button } from "../../components/Button/Button";
import FormFieldSelectAjax from "../../components/Form/FormFieldSelectAjax";
import Input from "../../components/Form/Input";
import Label from "../../components/Form/Label";
import Select from "../../components/Form/Select";
import DialogPanel from "../../components/Modal/DialogPanel";
import { createBsAction } from "../../services/bsActionService";
import pb from "../../pb";

const STATE_OPTIONS = [
  { id: "open", name: "Open" },
  { id: "in_progress", name: "In uitvoering" },
  { id: "closed", name: "Afgesloten" },
];

const EMPTY_FORM = { name: "", state: "open", assigned_to: "", datetime: "" };

const AddActionModal = ({ open, onClose, projectId, onSave }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setFormData(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const action = await createBsAction({
        name: formData.name.trim(),
        state: formData.state,
        assigned_to: formData.assigned_to || null,
        datetime: formData.datetime || null,
      });

      await pb.collection("bs_action_connections").create({
        connection_model: "bs_projects",
        connection_id: projectId,
        action: action.id,
      });

      setFormData(EMPTY_FORM);
      onSave(action);
      onClose();
    } catch (err) {
      console.error("Error creating action:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogPanel open={open} onClose={handleClose} title="Actie toevoegen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" required>
            Naam
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Naam van de actie"
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="state">Status</Label>
          <Select
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          >
            {STATE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>

        <FormFieldSelectAjax
          name="assigned_to"
          label="Toegewezen aan"
          collection="_pb_users_auth_"
          query={{ sort: "name" }}
          searchFields={["name", "email"]}
          optionDisplay="name"
          formData={formData}
          setFormData={setFormData}
          placeholder="Zoek persoon..."
        />

        <div>
          <Label htmlFor="datetime">Datum</Label>
          <Input
            id="datetime"
            type="date"
            value={formData.datetime}
            onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            onClick={handleClose}
            color="gray"
            text="Annuleren"
            className="flex-1 px-4 py-2 font-medium rounded-lg"
          />
          <Button
            type="submit"
            disabled={saving || !formData.name.trim()}
            color="blue"
            text={saving ? "Opslaan..." : "Opslaan"}
            className="flex-1 px-4 py-2 font-medium rounded-lg"
          />
        </div>
      </form>
    </DialogPanel>
  );
};

export default AddActionModal;
