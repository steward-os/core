import React from "react";
import { useNavigate } from "react-router-dom";
import { AddButton } from "../../../components/Button";
import CenteredAlert from "../../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../../components/List";
import { ListView } from "../../../components/List/ListView";
import { SimplePaginator } from "../../../components/List/SimplePaginator";
import { useDeleteBatchRun, useBatchRuns, useDeleteBatchRunWithConfirm } from "../../../hooks/crudResourceHooks";
import { buildFetchOptions } from "../../../hooks/utils/useColumnFilters";
import { usePagination } from "../../../hooks/utils/usePagination";

const STATUS_LABELS = {
  DRAFT: "Concept",
  PROCESSING: "Verwerking",
  COMPLETED: "Voltooid",
  FAILED: "Mislukt",
};

const STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-700",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const HEADER_COLUMNS = [
  {
    label: "Datum",
    width: "15%",
    field: "run_date",
    sortable: true,
    filter: "run_date",
    mobilePosition: "title",
    render: (item) => (item.run_date ? new Date(item.run_date).toLocaleDateString("nl-NL") : "-"),
  },
  {
    label: "Omschrijving",
    width: "35%",
    field: "description",
    sortable: true,
    filter: "description",
    mobilePosition: "title",
  },
  {
    label: "Type",
    width: "15%",
    field: "type",
    sortable: true,
    filter: "type",
    mobilePosition: "info",
  },
  {
    label: "Status",
    width: "15%",
    field: "status",
    sortable: true,
    mobilePosition: "info",
    render: (item) => {
      const label = STATUS_LABELS[item.status] || item.status || "-";
      const color = STATUS_COLORS[item.status] || "bg-gray-100 text-gray-700";
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>
      );
    },
  },
  {
    label: "Totaalbedrag",
    width: "20%",
    field: "total_amount",
    sortable: true,
    mobilePosition: "info",
    render: (item) =>
      item.total_amount != null
        ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(item.total_amount)
        : "-",
  },
];

const BatchRunList = () => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState({ sortField: "created", sortDirection: "desc", filters: {} });

  const {
    currentPage,
    perPage,
    totalItems,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    updatePaginationData,
    resetToFirstPage,
  } = usePagination(50);

  const queryOptions = buildFetchOptions(query, HEADER_COLUMNS);
  const { data, isLoading, error } = useBatchRuns(currentPage, perPage, queryOptions);
  const handleDelete = useDeleteBatchRunWithConfirm();
  const deleteBatchRunMutation = useDeleteBatchRun();

  const handleBulkDelete = async (selectedIds) => {
    await Promise.all(Array.from(selectedIds).map((id) => deleteBatchRunMutation.mutateAsync(id)));
  };

  React.useEffect(() => {
    if (data) {
      const totalPagesCount = Math.ceil(data.totalItems / perPage);
      updatePaginationData(data.items, data.totalItems, totalPagesCount);
    }
  }, [data, perPage, updatePaginationData]);

  React.useEffect(() => {
    resetToFirstPage();
  }, [query, resetToFirstPage]);

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={<AddButton onClick={() => navigate("/finance/batch-runs/new")} ariaLabel="Nieuwe batchrun" />}
      >
        Batchruns
      </ListHeading>

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <>
          <ListView
            data={data?.items || []}
            totalItems={data?.totalItems || 0}
            headerColumns={HEADER_COLUMNS}
            defaultSortField="created"
            defaultSortDirection="desc"
            emptyMessage="Geen batchruns gevonden."
            onClick={(item) => navigate(`/finance/batch-runs/${item.id}`)}
            onEdit={(item) => navigate(`/finance/batch-runs/${item.id}/edit`)}
            onDelete={handleDelete}
            onQueryChange={(newQuery) => {
              setQuery(newQuery);
              resetToFirstPage();
            }}
            enableSelection={true}
            onBulkDelete={handleBulkDelete}
            bulkDeleteText="Verwijder geselecteerde batchruns"
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

export default BatchRunList;
