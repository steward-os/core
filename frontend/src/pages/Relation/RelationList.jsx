import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import { SimplePaginator } from "../../components/List/SimplePaginator";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import { useDeleteRelation, useDeleteRelationWithConfirm, useRelations } from "../../hooks/crudResourceHooks";
import { useRelationTags } from "../../hooks/useRelationTagQuery";
import { usePagination } from "../../hooks/utils/usePagination";
import BatchInvoiceDialog from "./BatchInvoiceDialog";

const HEADER_COLUMNS = [
  {
    label: "Achternaam",
    width: "20%",
    field: "last_name",
    sortable: true,
    mobilePosition: "title",
  },
  {
    label: "Voornaam",
    width: "20%",
    field: "first_name",
    sortable: true,
    mobilePosition: "title",
  },
  {
    label: "Organisatie",
    width: "25%",
    field: "organisation",
    sortable: true,
    mobilePosition: "info",
  },
  {
    label: "E-mail",
    width: "35%",
    field: "email",
    render: (relation) => {
      return relation.email ? (
        <a href={`mailto:${relation.email}`} className="text-blue-600 hover:text-blue-800">
          {relation.email}
        </a>
      ) : (
        "-"
      );
    },
    sortable: true,
    mobilePosition: "info",
  },
];

const RelationList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState({ sortField: "last_name", sortDirection: "asc", filters: {} });
  const { queryOptions, conditionsKey } = useSmartTagFilter({
    query,
    headerColumns: HEADER_COLUMNS,
    baseOptions: { expand: "tags" },
  });
  const [isBatchInvoiceDialogOpen, setIsBatchInvoiceDialogOpen] = useState(false);
  const [selectedIdsForInvoice, setSelectedIdsForInvoice] = useState([]);

  const { data: availableTags } = useRelationTags({ sort: "name" });
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

  const { data, isLoading, error } = useRelations(currentPage, perPage, queryOptions);
  const handleDelete = useDeleteRelationWithConfirm();
  const deleteRelationMutation = useDeleteRelation();

  React.useEffect(() => {
    if (data) {
      const totalPagesCount = Math.ceil(data.totalItems / perPage);
      updatePaginationData(data.items, data.totalItems, totalPagesCount);
    }
  }, [data, perPage, updatePaginationData]);

  React.useEffect(() => {
    resetToFirstPage();
  }, [conditionsKey, resetToFirstPage]);

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
    resetToFirstPage();
  };

  const handleBulkDelete = async (selectedIds) => {
    const deletePromises = Array.from(selectedIds).map((relationId) => deleteRelationMutation.mutateAsync(relationId));
    await Promise.all(deletePromises);
  };

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={<AddButton onClick={() => navigate(`/relations/new?${searchParams.toString()}`)} ariaLabel="Nieuwe relatie" />}
      >
        Relatiebeheer
      </ListHeading>

      <SmartSearch
        availableTags={availableTags}
        searchFields={["last_name", "first_name", "organisation", "email"]}
        enableAndOr
      />

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <>
          <ListView
            data={data?.items || []}
            totalItems={data?.totalItems || 0}
            headerColumns={HEADER_COLUMNS}
            defaultSortField="last_name"
            defaultSortDirection="asc"
            emptyMessage="Geen relaties gevonden."
            onClick={(relation) => navigate(`/relations/${relation.id}?${searchParams.toString()}`)}
            onEdit={(relation) => navigate(`/relations/${relation.id}/edit?${searchParams.toString()}`)}
            onDelete={handleDelete}
            onQueryChange={handleQueryChange}
            enableSelection={true}
            onBulkDelete={handleBulkDelete}
            bulkDeleteText="Verwijder geselecteerde relaties"
            renderBulkActions={(selectedIds) => (
              <button
                onClick={() => {
                  setSelectedIdsForInvoice(selectedIds);
                  setIsBatchInvoiceDialogOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Maak verkoopfactuur
              </button>
            )}
          />
          <SimplePaginator
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            onPreviousPage={() => goToPreviousPage()}
            onNextPage={() => goToNextPage()}
          />
          <BatchInvoiceDialog
            open={isBatchInvoiceDialogOpen}
            onClose={() => setIsBatchInvoiceDialogOpen(false)}
            selectedIds={selectedIdsForInvoice}
            onComplete={() => {}}
          />
        </>
      )}
    </ListContainer>
  );
};

export default RelationList;
