import { useRef, useState } from "react";
import Label from "../../components/Form/Label";
import Input from "../../components/Form/Input";
import Textarea from "../../components/Form/Textarea";
import ImagePickerModal from "./ImagePickerModal";
import pb from "../../pb";

const BlockField = ({ field, value, onChange, mailingId }) => {
  const inputRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mailing", mailingId);
    const record = await pb.collection("bs_mailing_images").create(formData);
    onChange(pb.files.getURL(record, record.file));
  };

  if (field.type === "textarea") {
    return (
      <div>
        <Label htmlFor={`field-${field.id}`}>{field.label}</Label>
        <Textarea id={`field-${field.id}`} value={value} onChange={(e) => onChange(e.target.value)} rows={4} />
      </div>
    );
  }

  if (field.type === "image") {
    return (
      <div>
        <Label htmlFor={`field-${field.id}`}>{field.label}</Label>
        <div className="flex gap-2 items-start">
          <Input
            id={`field-${field.id}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="flex-1"
          />
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap transition-colors"
          >
            Uploaden
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap transition-colors"
          >
            Kies bestaand
          </button>
        </div>
        {value && (
          <img src={value} alt="" className="mt-2 max-h-24 rounded border border-gray-200 dark:border-gray-700 object-contain" />
        )}
        <ImagePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={onChange} />
      </div>
    );
  }

  if (field.type === "color") {
    return (
      <div>
        <Label htmlFor={`field-${field.id}`}>{field.label}</Label>
        <div className="flex gap-2 items-center">
          <input
            id={`field-${field.id}`}
            type="color"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className="flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={`field-${field.id}`}>{field.label}</Label>
      <Input
        id={`field-${field.id}`}
        type={field.type === "url" ? "url" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? ""}
      />
    </div>
  );
};

export default BlockField;
