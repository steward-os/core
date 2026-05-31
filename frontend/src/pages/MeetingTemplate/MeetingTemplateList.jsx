import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import { useDeleteMeetingTemplateWithConfirm, useMeetingTemplates } from "../../hooks/crudResourceHooks";

const HEADER_COLUMNS = [
  {
    label: "Naam",
    width: "50%",
    field: "name",
    sortable: true,
    filter: "name",
    mobilePosition: "title",
  },
  {
    label: "Beschrijving",
    width: "35%",
    field: "description",
    sortable: true,
    filter: "description",
    render: (template) => template.description || "-",
    mobilePosition: "info",
  },
];

const MeetingTemplateList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState({ sortField: "name", sortDirection: "asc", filters: {} });

  const { queryOptions } = useSmartTagFilter({ query, headerColumns: HEADER_COLUMNS });

  const { data, isLoading, error } = useMeetingTemplates(1, 100, queryOptions);
  const handleDelete = useDeleteMeetingTemplateWithConfirm();

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton
            onClick={() => navigate(`/meeting-templates/new?${searchParams.toString()}`)}
            ariaLabel="Nieuwe Template"
          />
        }
      >
        Meeting Templates
      </ListHeading>
      <SmartSearch searchFields={["name", "description"]} placeholder="Zoek op naam of beschrijving..." />

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="name"
          defaultSortDirection="asc"
          emptyMessage="Geen meeting templates gevonden."
          onClick={(template) => navigate(`/meeting-templates/${template.id}?${searchParams.toString()}`)}
          onEdit={(template) => navigate(`/meeting-templates/${template.id}/edit?${searchParams.toString()}`)}
          onDelete={handleDelete}
          onQueryChange={setQuery}
        />
      )}
    </ListContainer>
  );
};

export default MeetingTemplateList;
