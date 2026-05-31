import { useState, useEffect } from "react";
import DialogPanel from "../../components/Modal/DialogPanel";
import CorrespondenceFormFields, { DEFAULT_FORM_DATA, formDataFromRecord } from "./CorrespondenceFormFields";

const CorrespondenceQuickEditModal = ({ email, onClose, onSave }) => {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (email) {
      setFormData(formDataFromRecord(email));
    }
  }, [email]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(email.id, formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogPanel open={!!email} title="Snel bewerken" onClose={onClose}>
      <CorrespondenceFormFields formData={formData} setFormData={setFormData} email={email} />
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

export default CorrespondenceQuickEditModal;
