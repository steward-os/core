import { useState } from "react";
import DialogPanel from "../../components/Modal/DialogPanel";
import Label from "../../components/Form/Label";
import Textarea from "../../components/Form/Textarea";
import CorrespondenceFormFields, { DEFAULT_FORM_DATA } from "./CorrespondenceFormFields";

const CreateCorrespondenceModal = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...DEFAULT_FORM_DATA, body: "" });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      setFormData({ ...DEFAULT_FORM_DATA, body: "" });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogPanel open={open} title="Nieuwe correspondentie" onClose={onClose}>
      <CorrespondenceFormFields formData={formData} setFormData={setFormData} email={null} />
      <div className="mt-4">
        <Label htmlFor="cc-body">Inhoud</Label>
        <Textarea
          id="cc-body"
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          rows={6}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Annuleren
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </DialogPanel>
  );
};

export default CreateCorrespondenceModal;
