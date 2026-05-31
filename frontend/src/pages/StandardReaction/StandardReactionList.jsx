import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import { SimplePaginator } from "../../components/List/SimplePaginator";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import { useDeleteStandardReaction, useStandardReactionsPaginated } from "../../hooks/useStandardReactionQuery";
import { usePagination } from "../../hooks/utils/usePagination";

const HEADER_COLUMNS = [
  {
    label: "Emoji",
    width: "15%",
    field: "emoji",
    sortable: false,
    mobilePosition: "info",
  },
  {
    label: "Reactie",
    width: "50%",
    field: "reaction",
    sortable: true,
    filter: "reaction",
    mobilePosition: "title",
  },
];

const StandardReactionList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [query, setQuery] = useState({ sortField: "reaction", sortDirection: "asc", filters: {} });
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

  const { queryOptions, conditionsKey } = useSmartTagFilter({ query, headerColumns: HEADER_COLUMNS });

  const { data, isLoading, error } = useStandardReactionsPaginated(currentPage, perPage, queryOptions);
  const deleteReactionMutation = useDeleteStandardReaction();

  React.useEffect(() => {
    if (data) {
      const totalPagesCount = Math.ceil(data.totalItems / perPage);
      updatePaginationData(data.items, data.totalItems, totalPagesCount);
    }
  }, [data, perPage, updatePaginationData]);

  React.useEffect(() => {
    resetToFirstPage();
  }, [query, conditionsKey, resetToFirstPage]);

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
    resetToFirstPage();
  };

  const handleDelete = async (reactionId) => {
    if (window.confirm("Weet je zeker dat je deze reactie wilt verwijderen?")) {
      try {
        await deleteReactionMutation.mutateAsync(reactionId);
        return true;
      } catch (error) {
        console.error("Error deleting reaction:", error);
        return false;
      }
    }
    return false;
  };

  const handleBulkDelete = async (selectedIds) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map((id) => deleteReactionMutation.mutateAsync(id));
      await Promise.all(deletePromises);
      await queryClient.invalidateQueries({ queryKey: ["standard-reactions"] });
      await queryClient.invalidateQueries({ queryKey: ["standard-reactions-paginated"] });
    } catch (error) {
      console.error("Error during bulk delete:", error);
      alert("Er is een fout opgetreden bij het verwijderen van reacties.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton
            onClick={() => navigate(`/standard-reactions/new?${searchParams.toString()}`)}
            ariaLabel="Nieuwe reactie"
          />
        }
      >
        Standaard reacties
      </ListHeading>
      <SmartSearch searchFields={["reaction", "emoji"]} placeholder="Zoek op reactie..." />
      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <>
          <ListView
            data={data?.items || []}
            totalItems={data?.totalItems || 0}
            headerColumns={HEADER_COLUMNS}
            defaultSortField="reaction"
            defaultSortDirection="asc"
            emptyMessage="Geen reacties gevonden."
            onClick={(reaction) => navigate(`/standard-reactions/${reaction.id}?${searchParams.toString()}`)}
            onEdit={(reaction) => navigate(`/standard-reactions/${reaction.id}/edit?${searchParams.toString()}`)}
            onDelete={handleDelete}
            onQueryChange={handleQueryChange}
            enableSelection={true}
            onBulkDelete={handleBulkDelete}
            bulkDeleteText="Verwijder geselecteerde reacties"
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

export default StandardReactionList;
