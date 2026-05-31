import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EyeIcon, PlusIcon } from "@heroicons/react/24/outline";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import Label from "../../components/Form/Label";
import Input from "../../components/Form/Input";
import Select from "../../components/Form/Select";
import SortableBlock from "../../features/mailings/SortableBlock";
import PreviewModal from "../../features/mailings/PreviewModal";
import { useMailing, useEmailTemplates, useMailingTemplateBlocks } from "../../hooks/crudResourceHooks";
import { useMailingEditor } from "../../hooks/useMailingEditor";
import { parseFieldsJson, compileMjml } from "../../utils/mjmlUtils";

const MailingEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: mailing, isLoading: mailingLoading, error } = useMailing(id);
  const { data: templatesData } = useEmailTemplates(1, 200, { sort: "name" });
  const templates = templatesData?.items ?? [];

  const [formData, setFormData] = useState({ subject: "", to: "", template: "" });
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    if (mailing) {
      setFormData({ subject: mailing.subject ?? "", to: mailing.to ?? "", template: mailing.template ?? "" });
    }
  }, [mailing]);

  const {
    mailingBlocks,
    blockContents,
    blockDefsById,
    blocksLoading,
    sensors,
    handleDragEnd,
    handleAddBlock,
    handleRemoveBlock,
    handleContentChange,
    buildPreviewMjml,
    handleSave,
    handleSend,
    isSaving,
    isSending,
  } = useMailingEditor(id);

  const { data: allBlockDefsData } = useMailingTemplateBlocks(1, 200, { sort: "name" });
  const availableBlocks = allBlockDefsData?.items ?? [];

  const allBlockDefsById = { ...blockDefsById };
  for (const b of availableBlocks) allBlockDefsById[b.id] = b;

  const handlePreview = async () => {
    try {
      const html = await compileMjml(await buildPreviewMjml(formData, templates));
      setPreviewHtml(html);
    } catch (err) {
      setPreviewHtml(
        `<html><body style="font-family: sans-serif; padding: 16px;">Preview fout: ${err.message}</body></html>`,
      );
    }
    setShowPreview(true);
  };

  if (mailingLoading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!mailing) return <CenteredAlert text="Mailing niet gevonden." />;

  const isSent = mailing.state === "sent";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/mailings")}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← Terug
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isSent ? "Mailing bekijken" : "Mailing samenstellen"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isSent
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
            }`}
          >
            {isSent ? "Verzonden" : "Concept"}
          </span>
        </div>
      </div>

      {/* Metadata form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="to">Aan</Label>
            <Input
              id="to"
              type="email"
              value={formData.to}
              onChange={(e) => setFormData((p) => ({ ...p, to: e.target.value }))}
              placeholder="ontvanger@email.nl"
              disabled={isSent}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="subject">Onderwerp</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Onderwerp van de e-mail"
              disabled={isSent}
            />
          </div>
          <div>
            <Label htmlFor="template">Template</Label>
            <Select
              id="template"
              value={formData.template}
              onChange={(e) => setFormData((p) => ({ ...p, template: e.target.value }))}
              disabled={isSent}
            >
              <option value="">— Geen template —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Builder area */}
      {!isSent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Block palette */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Blokken</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {availableBlocks.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 italic">
                    Geen blokken beschikbaar.
                  </p>
                ) : (
                  availableBlocks.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => handleAddBlock(block)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                    >
                      <PlusIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                          {block.name}
                        </p>
                        {block.fields && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {parseFieldsJson(block.fields).map((f) => f.label).join(", ")}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Block canvas */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Inhoudsblokken
              {mailingBlocks.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                  ({mailingBlocks.length})
                </span>
              )}
            </h2>

            {blocksLoading ? (
              <CenteredSpinner />
            ) : mailingBlocks.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-12 text-center text-gray-400 dark:text-gray-500">
                <p className="text-sm">Nog geen blokken toegevoegd.</p>
                <p className="text-xs mt-1">Klik op een blok links om het toe te voegen.</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={mailingBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {mailingBlocks.map((mb) => (
                      <SortableBlock
                        key={mb.id}
                        mailingBlock={{ ...mb, content: blockContents[mb.id] ?? mb.content ?? {} }}
                        blockDef={allBlockDefsById[typeof mb.block === "string" ? mb.block : mb.block?.id] ?? mb.expand?.block}
                        onRemove={handleRemoveBlock}
                        onContentChange={handleContentChange}
                        mailingId={id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      )}

      {/* Read-only view for sent mailings */}
      {isSent && mailingBlocks.length > 0 && (
        <div className="space-y-3">
          {mailingBlocks.map((mb) => {
            const blockDef = allBlockDefsById[typeof mb.block === "string" ? mb.block : mb.block?.id] ?? mb.expand?.block;
            const fields = parseFieldsJson(blockDef?.fields);
            const content = mb.content ?? {};
            return (
              <div key={mb.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{blockDef?.name}</span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {fields.map((f) => (
                    <div key={f.id} className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{f.label}: </span>
                      <span className="text-gray-800 dark:text-gray-200">{content[f.id] ?? "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={handlePreview}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <EyeIcon className="h-4 w-4" />
          MJML voorbeeld
        </button>

        {!isSent && (
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(formData, templates)}
              disabled={isSaving}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Opslaan..." : "Opslaan als concept"}
            </button>
            <button
              onClick={() => handleSend(formData, templates, navigate)}
              disabled={isSending || isSaving}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSending ? "Verzenden..." : "Verzenden"}
            </button>
          </div>
        )}
      </div>

      <PreviewModal open={showPreview} html={previewHtml} onClose={() => setShowPreview(false)} />
    </div>
  );
};

export default MailingEdit;
