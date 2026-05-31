import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import CenteredSpinner from "../../components/CenteredSpinner";
import CenteredAlert from "../../components/CenteredAlert";
import {
  useEmailTemplate,
  useMailingTemplateBlocks,
  useCreateMailingTemplateBlock,
  useUpdateMailingTemplateBlock,
  useDeleteMailingTemplateBlockWithConfirm,
} from "../../hooks/crudResourceHooks";
import TemplateBlockEditModal from "./TemplateBlockEditModal";
import { parseFieldsJson } from "../../utils/mjmlUtils";

const TemplateBlockList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingBlock, setEditingBlock] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: template, isLoading: templateLoading } = useEmailTemplate(id);
  const { data: blocksData, isLoading: blocksLoading } = useMailingTemplateBlocks(1, 200, {
    filter: `template="${id}"`,
    sort: "name",
  });
  const { mutateAsync: createBlock } = useCreateMailingTemplateBlock();
  const { mutateAsync: updateBlock } = useUpdateMailingTemplateBlock();
  const handleDelete = useDeleteMailingTemplateBlockWithConfirm();

  const blocks = blocksData?.items ?? [];

  const handleCreate = async (data) => {
    await createBlock({ ...data, template: id });
  };

  const handleUpdate = async (data) => {
    await updateBlock({ id: editingBlock.id, data });
  };

  if (templateLoading || blocksLoading) return <CenteredSpinner />;
  if (!template) return <CenteredAlert text="Template niet gevonden." />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/email-templates/${id}`)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Terug
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Blokken</h1>
            <p className="text-sm text-gray-500">{template.name}</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Nieuw blok
        </button>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm">Geen blokken gedefinieerd.</p>
          <p className="text-xs mt-1">Maak een blok aan om te beginnen met de bouwer.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y">
          {blocks.map((block) => {
            const fields = parseFieldsJson(block.fields);
            return (
              <div key={block.id} className="flex items-start px-4 py-4 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{block.name}</p>
                  {fields.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Velden: {fields.map((f) => f.label || f.id).join(", ")}
                    </p>
                  )}
                  {block.mjml && (
                    <p className="text-xs text-gray-400 font-mono mt-1 truncate max-w-md">
                      {block.mjml.slice(0, 80)}{block.mjml.length > 80 ? "…" : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingBlock(block)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Bewerken"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(block.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Verwijderen"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TemplateBlockEditModal
        open={isCreating}
        block={null}
        onClose={() => setIsCreating(false)}
        onSave={handleCreate}
      />
      <TemplateBlockEditModal
        open={!!editingBlock}
        block={editingBlock}
        onClose={() => setEditingBlock(null)}
        onSave={handleUpdate}
      />
    </div>
  );
};

export default TemplateBlockList;
