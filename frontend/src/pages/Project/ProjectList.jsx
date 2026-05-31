import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { FilterRow, ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import { useDeleteProjectWithConfirm, useProjects } from "../../hooks/crudResourceHooks";

const HEADER_COLUMNS = [
  {
    label: "Naam",
    width: "50%",
    field: "name",
    sortable: true,
    mobilePosition: "title",
  },
  {
    label: "Status",
    width: "30%",
    field: "state",
    render: (item) => {
      const statusLabels = {
        open: "Open",
        active: "Actief",
        closed: "Afgesloten",
      };
      const statusColors = {
        open: "bg-yellow-100 text-yellow-800",
        active: "bg-green-100 text-green-800",
        closed: "bg-gray-100 text-gray-800",
      };
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[item.state] || statusColors.open}`}
        >
          {statusLabels[item.state] || item.state}
        </span>
      );
    },
    sortable: true,
    mobilePosition: "right",
  },
  {
    label: "Aangemaakt",
    width: "20%",
    field: "created",
    sortable: true,
    mobilePosition: "info",
  },
];

const PROJECT_FILTER_OPTIONS = [
  { value: "all", label: "Alle projecten" },
  { value: "open", label: "Open" },
  { value: "active", label: "Actief" },
  { value: "closed", label: "Afgesloten" },
];

const ProjectList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState({ sortField: "created", sortDirection: "desc", filters: {} });

  // Get stateFilter from URL
  const stateFilter = searchParams.get("stateFilter") || "all";

  // Setter function for stateFilter
  const setStateFilter = (value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete("stateFilter");
    } else {
      newParams.set("stateFilter", value);
    }
    setSearchParams(newParams);
  };

  const stateCondition = stateFilter && stateFilter !== "all" ? [`state = "${stateFilter}"`] : [];
  const { queryOptions } = useSmartTagFilter({
    query,
    headerColumns: HEADER_COLUMNS,
    extraConditions: stateCondition,
  });

  // React Query hooks
  const { data, isLoading, error } = useProjects(1, 100, queryOptions);
  const handleDelete = useDeleteProjectWithConfirm();

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton onClick={() => navigate(`/projects/new?${searchParams.toString()}`)} ariaLabel="Nieuw project" />
        }
      >
        Projecten
      </ListHeading>
      <SmartSearch searchFields={["name"]} placeholder="Zoek op naam..." />

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="created"
          defaultSortDirection="desc"
          emptyMessage="Geen projecten gevonden."
          onClick={(project) => navigate(`/projects/${project.id}?${searchParams.toString()}`)}
          onEdit={(project) => navigate(`/projects/${project.id}/edit?${searchParams.toString()}`)}
          onDelete={handleDelete}
          onQueryChange={setQuery}
          filterRow={<FilterRow options={PROJECT_FILTER_OPTIONS} value={stateFilter} onChange={setStateFilter} />}
        />
      )}
    </ListContainer>
  );
};

export default ProjectList;
