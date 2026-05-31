import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import {
  useCreateEmailTemplate,
  useDeleteEmailTemplateWithConfirm,
  useEmailTemplates,
} from "../../hooks/crudResourceHooks";
import { formatDateTime } from "../../utils/dateTimeUtils";
import CreateEmailTemplateModal from "./CreateEmailTemplateModal";

const HEADER_COLUMNS = [
  {
    label: "Naam",
    field: "name",
    sortable: true,
    mobilePosition: "title",
  },
  {
    label: "Aangemaakt",
    width: "20%",
    field: "created",
    sortable: true,
    mobilePosition: "info",
    render: (template) => formatDateTime(template.created),
  },
  {
    label: "Bijgewerkt",
    width: "20%",
    field: "updated",
    sortable: true,
    mobilePosition: "info",
    render: (template) => formatDateTime(template.updated),
  },
];

const EmailTemplateList = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const { data, isLoading, error } = useEmailTemplates(1, 200, { sort: "name" });
  const { mutateAsync: createEmailTemplate } = useCreateEmailTemplate();
  const handleDelete = useDeleteEmailTemplateWithConfirm();

  const handleCreate = async (data) => {
    const template = await createEmailTemplate(data);
    navigate(`/email-templates/${template.id}`);
  };

  return (
    <ListContainer>
      <ListHeading button={<AddButton onClick={() => setIsCreating(true)} ariaLabel="Maak template" />}>
        E-mailtemplates
      </ListHeading>

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="name"
          defaultSortDirection="asc"
          emptyMessage="Geen e-mailtemplates gevonden."
          onClick={(template) => navigate(`/email-templates/${template.id}`)}
          onDelete={handleDelete}
        />
      )}

      <CreateEmailTemplateModal open={isCreating} onClose={() => setIsCreating(false)} onSave={handleCreate} />
    </ListContainer>
  );
};

export default EmailTemplateList;
