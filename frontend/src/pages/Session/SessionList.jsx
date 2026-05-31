import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { FilterRow, ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import SmartSearch from "../../components/List/SmartSearch";
import { SimplePaginator } from "../../components/List/SimplePaginator";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import { useDeleteSessionWithConfirm, useDuplicateSession, useSessions } from "../../hooks/crudResourceHooks";
import { usePagination } from "../../hooks/utils/usePagination";

const HEADER_COLUMNS = [
  {
    label: "Datum",
    width: "22%",
    field: "date_time",
    sortable: true,
    mobilePosition: "info",
  },
  {
    label: "Naam",
    width: "38%",
    field: "name",
    sortable: true,
    filter: "name",
    mobilePosition: "title",
  },
  {
    label: "Groep",
    width: "25%",
    field: "expand.groups.name",
    render: (session) => session.expand?.groups?.map((o) => o.name).join(", ") || "",
    sortable: false,
    filter: (value) => `groups.name ~ "${value}"`,
    mobilePosition: "info",
  },
];

const SESSION_FILTER_OPTIONS = [
  { value: "future", label: "Gepland" },
  { value: "past", label: "Afgelopen" },
];

const SessionList = ({ isSessionAdmin = false }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState({ sortField: "date_time", sortDirection: "asc", filters: {} });

  const sessionFilter = searchParams.get("sessionFilter") || "future";

  const setSessionFilter = (value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "future") newParams.delete("sessionFilter");
    else newParams.set("sessionFilter", value);
    setSearchParams(newParams);
  };

  const today = new Date().toISOString().split("T")[0];
  const timeFilter = sessionFilter === "future" ? `date_time >= "${today}"` : `date_time < "${today}"`;

  const { queryOptions, conditionsKey } = useSmartTagFilter({
    query,
    headerColumns: HEADER_COLUMNS,
    baseOptions: { expand: "groups" },
    extraConditions: [timeFilter],
  });

  const {
    currentPage,
    perPage,
    totalItems,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    updatePaginationData,
    resetToFirstPage,
  } = usePagination(100);

  const { data, isLoading, error } = useSessions(currentPage, perPage, queryOptions);
  const handleDelete = useDeleteSessionWithConfirm();
  const duplicateSessionMutation = useDuplicateSession();

  React.useEffect(() => {
    if (data) {
      const totalPagesCount = Math.ceil(data.totalItems / perPage);
      updatePaginationData(data.items, data.totalItems, totalPagesCount);
    }
  }, [data, perPage, updatePaginationData]);

  React.useEffect(() => {
    resetToFirstPage();
  }, [sessionFilter, query, conditionsKey, resetToFirstPage]);

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
    resetToFirstPage();
  };

  const handleDuplicate = async (session) => {
    try {
      await duplicateSessionMutation.mutateAsync(session.id);
      return true;
    } catch (error) {
      console.error("Error duplicating session:", error);
      alert("Fout bij dupliceren van sessie. Probeer het opnieuw.");
      return false;
    }
  };

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          isSessionAdmin ? (
            <AddButton onClick={() => navigate(`/sessions/new?${searchParams.toString()}`)} ariaLabel="Nieuwe sessie" />
          ) : null
        }
      >
        Sessies
      </ListHeading>
      <SmartSearch searchFields={["name"]} placeholder="Zoek op naam..." />

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <>
          <ListView
            data={data?.items || []}
            totalItems={data?.totalItems || 0}
            headerColumns={HEADER_COLUMNS}
            defaultSortField="date_time"
            defaultSortDirection="asc"
            emptyMessage="Geen sessies gevonden."
            onClick={(session) => navigate(`/sessions/${session.id}?${searchParams.toString()}`)}
            onEdit={
              isSessionAdmin
                ? (session) => navigate(`/sessions/${session.id}/edit?${searchParams.toString()}`)
                : undefined
            }
            onDelete={isSessionAdmin ? handleDelete : undefined}
            onDuplicate={isSessionAdmin ? handleDuplicate : undefined}
            onQueryChange={isSessionAdmin ? handleQueryChange : undefined}
            filterRow={
              isSessionAdmin ? (
                <FilterRow options={SESSION_FILTER_OPTIONS} value={sessionFilter} onChange={setSessionFilter} />
              ) : undefined
            }
          />
          <SimplePaginator
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            onPreviousPage={() => goToPreviousPage()}
            onNextPage={() => goToNextPage()}
          />
        </>
      )}
    </ListContainer>
  );
};

export default SessionList;
