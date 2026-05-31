import { useState } from "react";
import { Button } from "../../../components/Button/Button";
import DialogPanel from "../../../components/Modal/DialogPanel";

const DemoAdminDialog = ({ open, onClose, events }) => {
  const [copied, setCopied] = useState(false);

  if (!events || events.length === 0) return null;

  const handleCopy = () => {
    const text = events
      .map((e) => `${e.title}\n${e.detail}`)
      .join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <DialogPanel open={open} onClose={onClose} title="Wat er in 2024 is gebeurd">
      <div className="space-y-4">
        <div className="space-y-4">
          {events.map((event, i) => (
            <div key={i}>
              <p className="font-medium text-sm text-gray-900">{event.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{event.detail}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-2">
          <Button
            color={copied ? "green" : "gray"}
            onClick={handleCopy}
            text={copied ? "Gekopieerd!" : "Kopieer tekst"}
          />
          <Button color="gray" onClick={onClose} text="Sluiten" />
        </div>
      </div>
    </DialogPanel>
  );
};

export default DemoAdminDialog;
