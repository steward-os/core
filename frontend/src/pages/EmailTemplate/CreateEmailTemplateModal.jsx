import { useState } from "react";
import DialogPanel from "../../components/Modal/DialogPanel";
import Label from "../../components/Form/Label";
import Input from "../../components/Form/Input";

const CreateEmailTemplateModal = ({ open, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave({ name: name.trim() });
      setName("");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <DialogPanel open={open} title="Nieuw e-mailtemplate" onClose={handleClose}>
      <div>
        <Label htmlFor="template-name">Naam</Label>
        <Input
          id="template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Annuleren
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? "Opslaan..." : "Maak template"}
        </button>
      </div>
    </DialogPanel>
  );
};

export default CreateEmailTemplateModal;
