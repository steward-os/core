import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import Label from "../../components/Form/Label";
import Input from "../../components/Form/Input";
import CodeEditor from "../../components/Form/CodeEditor";
import { useEmailTemplate, useUpdateEmailTemplate } from "../../hooks/crudResourceHooks";

const EmailTemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: template, isLoading, error } = useEmailTemplate(id);
  const { mutateAsync: updateEmailTemplate, isPending: isSaving } = useUpdateEmailTemplate();

  const [formData, setFormData] = useState({ name: "", description: "", layout: "" });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name ?? "",
        description: template.description ?? "",
        layout: template.layout ?? "",
      });
    }
  }, [template]);

  const set = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    await updateEmailTemplate({ id, data: formData });
  };

  if (isLoading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!template) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/email-templates")}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Terug
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{template.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/email-templates/${id}/blocks`)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Squares2X2Icon className="h-4 w-4" />
            Blokken beheren
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <Label htmlFor="tpl-name">Naam</Label>
          <Input
            id="tpl-name"
            value={formData.name}
            onChange={set("name")}
          />
        </div>
        <div>
          <Label htmlFor="tpl-description">Omschrijving</Label>
          <Input
            id="tpl-description"
            value={formData.description}
            onChange={set("description")}
            placeholder="Korte omschrijving van dit template"
          />
        </div>
        <div>
          <Label htmlFor="tpl-layout">MJML Layout wrapper</Label>
          <p className="text-xs text-gray-500 mb-1">
            Gebruik{" "}
            <code className="bg-gray-100 px-1 rounded font-mono">{"{{content}}"}</code>{" "}
            als placeholder waar de inhoudsblokken worden ingevoegd.
          </p>
          <CodeEditor
            value={formData.layout}
            onChange={(value) => setFormData((prev) => ({ ...prev, layout: value }))}
            lang="html"
            minHeight="400px"
          />
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;
