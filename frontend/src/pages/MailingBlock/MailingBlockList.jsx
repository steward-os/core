import { useState } from "react";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import {
  useMailingTemplateBlocks,
  useCreateMailingTemplateBlock,
  useUpdateMailingTemplateBlock,
  useDeleteMailingTemplateBlockWithConfirm,
} from "../../hooks/crudResourceHooks";
import TemplateBlockEditModal from "../EmailTemplate/TemplateBlockEditModal";
import { parseFieldsJson } from "../../utils/mjmlUtils";

const HEADER_COLUMNS = [
  {
    label: "Naam",
    field: "name",
    width: "30%",
    sortable: true,
    mobilePosition: "title",
  },
  {
    label: "Velden",
    field: "fields",
    width: "40%",
    sortable: false,
    mobilePosition: "info",
    render: (block) => {
      const fields = parseFieldsJson(block.fields);
      return fields.length > 0 ? fields.map((f) => f.label || f.id).join(", ") : "—";
    },
  },
  {
    label: "Type",
    field: "smart_type",
    width: "20%",
    sortable: false,
    mobilePosition: "info",
    render: (block) => block.smart_type || "Handmatig",
  },
];

const MailingBlockList = () => {
  const [editingBlock, setEditingBlock] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState({ sortField: "name", sortDirection: "asc", filters: {} });

  const { queryOptions } = useSmartTagFilter({
    query,
    headerColumns: HEADER_COLUMNS,
    baseOptions: {},
  });

  const { data, isLoading, error } = useMailingTemplateBlocks(1, 200, queryOptions);
  const { mutateAsync: createBlock } = useCreateMailingTemplateBlock();
  const { mutateAsync: updateBlock } = useUpdateMailingTemplateBlock();
  const handleDelete = useDeleteMailingTemplateBlockWithConfirm();

  const handleDuplicate = async (block) => {
    await createBlock({
      name: `${block.name} (kopie)`,
      smart_type: block.smart_type || "",
      mjml: block.mjml || "",
      fields: block.fields ?? [],
    });
  };

  const handleCreate = async (data) => {
    await createBlock(data);
    setIsCreating(false);
  };

  const handleUpdate = async (data) => {
    await updateBlock({ id: editingBlock.id, data });
    setEditingBlock(null);
  };

  return (
    <ListContainer fullWidth>
      <ListHeading button={<AddButton onClick={() => setIsCreating(true)} ariaLabel="Nieuw blok" />}>
        Mailingblokken
      </ListHeading>
      <SmartSearch searchFields={["name"]} placeholder="Zoek op naam..." />

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="name"
          defaultSortDirection="asc"
          emptyMessage="Geen mailingblokken gevonden."
          onEdit={setEditingBlock}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onQueryChange={setQuery}
        />
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
    </ListContainer>
  );
};

export default MailingBlockList;
