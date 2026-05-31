import { useState } from "react";
import DialogPanel from "../../components/Modal/DialogPanel";
import Label from "../../components/Form/Label";
import Select from "../../components/Form/Select";

const SetTypeModal = ({ open, onClose, onConfirm }) => {
  const [type, setType] = useState("email");

  const handleConfirm = () => {
    onConfirm(type);
    onClose();
  };

  return (
    <DialogPanel open={open} title="Type instellen" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="set-type">Type</Label>
          <Select id="set-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="brief">Brief</option>
            <option value="email">Email</option>
            <option value="app">App</option>
            <option value="gespreksnotitie">Gespreksnotitie</option>
            <option value="anders">Anders</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </DialogPanel>
  );
};

export default SetTypeModal;
