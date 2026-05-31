import { useEffect, useState } from "react";
import { Button } from "../../components/Button/Button"; // Make sure this path is correct
import Label from "../../components/Form/Label";
import Input from "../../components/Form/Input";
import Textarea from "../../components/Form/Textarea";
import DialogPanel from "../../components/Modal/DialogPanel";

const BannerForm = ({ open, onClose, onSubmit, initialData = {}, saving = false }) => {
  const [message, setMessage] = useState(initialData.message || "");
  const [active, setActive] = useState(initialData.active || false);
  const [link, setLink] = useState(initialData.link || "");

  useEffect(() => {
    setMessage(initialData.message || "");
    setActive(initialData.active || false);
    setLink(initialData.link || "");
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message) {
      alert("Vul een bericht in.");
      return;
    }
    onSubmit({
      message,
      active,
      link: link || null, // Send null if link is empty
    });
  };

  return (
    <DialogPanel
      open={open}
      onClose={onClose}
      title={initialData.id ? "Banner bericht bewerken" : "Nieuw banner bericht"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div>
          <Label htmlFor="message">Bericht</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Voer het bericht in"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-gray-500 mt-1">HTML opmaak is toegestaan voor simpele styling.</p>
        </div>
        
        <div>
          <Label htmlFor="link">Link (optioneel)</Label>
          <Input
            id="link"
            name="link"
            placeholder="bijv. /volunteering"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Een link waar gebruikers naartoe kunnen gaan voor meer informatie.</p>
        </div>

        <div className="flex items-center">
          <input
            id="active-checkbox"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <Label htmlFor="active-checkbox" className="ml-2 mb-0">
            Bericht actief
          </Label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            onClick={onClose}
            color="gray"
            text="Annuleren"
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg"
          />
          <Button
            type="submit"
            disabled={saving}
            color="blue"
            text={saving ? "Opslaan..." : initialData.id ? "Opslaan" : "Aanmaken"}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg"
          />
        </div>
      </form>
    </DialogPanel>
  );
};

export default BannerForm;
