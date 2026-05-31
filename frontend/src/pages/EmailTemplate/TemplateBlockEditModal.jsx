import { useEffect, useState } from "react";
import DialogPanel from "../../components/Modal/DialogPanel";
import Label from "../../components/Form/Label";
import Input from "../../components/Form/Input";
import Select from "../../components/Form/Select";
import CodeEditor from "../../components/Form/CodeEditor";
import { SMART_BLOCK_LABELS } from "../../features/mailings/smartBlockRenderers";

const DEFAULT_FIELDS_PLACEHOLDER = `[
  {"id": "title", "type": "text", "label": "Titel"},
  {"id": "body", "type": "textarea", "label": "Tekst"},
  {"id": "image_url", "type": "image", "label": "Afbeelding"},
  {"id": "button_url", "type": "url", "label": "Knop URL"}
]`;

const EMPTY_FORM = { name: "", smart_type: "", mjml: "", fields: "[]" };

const TemplateBlockEditModal = ({ open, block, onClose, onSave }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fieldsError, setFieldsError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (block) {
        setFormData({
          name: block.name || "",
          smart_type: block.smart_type || "",
          mjml: block.mjml || "",
          fields: typeof block.fields === "string"
            ? block.fields
            : JSON.stringify(block.fields ?? [], null, 2),
        });
      } else {
        setFormData(EMPTY_FORM);
      }
      setFieldsError(null);
    }
  }, [open, block]);

  const set = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const isSmartBlock = !!formData.smart_type;

  const handleSave = async () => {
    let parsedFields = [];
    if (!isSmartBlock) {
      try {
        parsedFields = JSON.parse(formData.fields);
        if (!Array.isArray(parsedFields)) throw new Error("Moet een array zijn");
      } catch (err) {
        setFieldsError(`Ongeldige JSON: ${err.message}`);
        return;
      }
    }
    setFieldsError(null);
    setIsSaving(true);
    try {
      await onSave({
        name: formData.name,
        smart_type: formData.smart_type || "",
        mjml: isSmartBlock ? "" : formData.mjml,
        fields: isSmartBlock ? [] : parsedFields,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogPanel
      open={open}
      title={block ? "Blok bewerken" : "Nieuw blok"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="block-name">Naam</Label>
          <Input
            id="block-name"
            value={formData.name}
            onChange={set("name")}
            placeholder="bijv. Tekst met afbeelding"
          />
        </div>

        <div>
          <Label htmlFor="block-smart-type">Type</Label>
          <Select
            id="block-smart-type"
            value={formData.smart_type}
            onChange={set("smart_type")}
          >
            <option value="">— Handmatig (MJML + velden) —</option>
            {Object.entries(SMART_BLOCK_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
          {isSmartBlock && (
            <p className="mt-1 text-xs text-blue-600">
              Dit blok haalt automatisch data op — geen MJML of velden nodig.
            </p>
          )}
        </div>

        {!isSmartBlock && (
          <>
            <div>
              <Label htmlFor="block-mjml">MJML snippet</Label>
              <p className="text-xs text-gray-500 mb-1">
                Gebruik {"{{veldnaam}}"} als placeholder voor dynamische inhoud.
              </p>
              <CodeEditor
                value={formData.mjml}
                onChange={(value) => setFormData((prev) => ({ ...prev, mjml: value }))}
                lang="html"
                minHeight="200px"
              />
            </div>

            <div>
              <Label htmlFor="block-fields">Velden (JSON)</Label>
              <p className="text-xs text-gray-500 mb-1">
                Defineer de invoervelden voor dit blok. Types: text, textarea, image, url, color.
              </p>
              <CodeEditor
                value={formData.fields}
                onChange={(value) => setFormData((prev) => ({ ...prev, fields: value }))}
                lang="json"
                minHeight="180px"
              />
              {fieldsError && (
                <p className="mt-1 text-xs text-red-600">{fieldsError}</p>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name || isSaving}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>
    </DialogPanel>
  );
};

export default TemplateBlockEditModal;
