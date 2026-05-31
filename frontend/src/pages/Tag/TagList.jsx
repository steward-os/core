import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import { SimplePaginator } from "../../components/List/SimplePaginator";
import { useAllTagsPaginated, useDeleteRelationTag } from "../../hooks/useRelationTagQuery";
import { buildColumnFilterConditions } from "../../hooks/utils/useColumnFilters";
import { usePagination } from "../../hooks/utils/usePagination";

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
    label: "Kleur",
    width: "20%",
    field: "color",
    render: (tag) => {
      return tag.color ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: tag.color }}></div>
          <span className="text-sm font-mono">{tag.color}</span>
        </div>
      ) : (
        "-"
      );
    },
    sortable: false,
    mobilePosition: "info",
  },
  {
    label: "Type",
    width: "20%",
    field: "type",
    render: (tag) => tag.type || "-",
    sortable: true,
    filter: "type",
    mobilePosition: "info",
  },
  {
    label: "Beschrijving",
    width: "30%",
    field: "description",
    render: (tag) => tag.description || "-",
    sortable: false,
    filter: "description",
    mobilePosition: "info",
  },
];

const TagList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [query, setQuery] = useState({ sortField: "name", sortDirection: "asc", filters: {} });
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

  const filterConditions = buildColumnFilterConditions(query.filters, HEADER_COLUMNS);

  const queryOptions = {
    sort: query.sortDirection === "desc" ? `-${query.sortField}` : query.sortField,
    ...(filterConditions.length > 0 && {
      filter: filterConditions.join(" && "),
    }),
  };

  const { data, isLoading, error } = useAllTagsPaginated(currentPage, perPage, queryOptions);
  const deleteTagMutation = useDeleteRelationTag();

  React.useEffect(() => {
    if (data) {
      const totalPagesCount = Math.ceil(data.totalItems / perPage);
      updatePaginationData(data.items, data.totalItems, totalPagesCount);
    }
  }, [data, perPage, updatePaginationData]);

  React.useEffect(() => {
    resetToFirstPage();
  }, [query, resetToFirstPage]);

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
    resetToFirstPage();
  };

  const handleDelete = async (tagId) => {
    if (window.confirm("Weet je zeker dat je deze tag wilt verwijderen?")) {
      try {
        await deleteTagMutation.mutateAsync(tagId);
        return true;
      } catch (error) {
        console.error("Error deleting tag:", error);
        return false;
      }
    }
    return false;
  };

  const handleBulkDelete = async (selectedIds) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map((tagId) => deleteTagMutation.mutateAsync(tagId));
      await Promise.all(deletePromises);
      await queryClient.invalidateQueries({ queryKey: ["all-tags"] });
      await queryClient.invalidateQueries({ queryKey: ["all-tags-paginated"] });
    } catch (error) {
      console.error("Error during bulk delete:", error);
      alert("Er is een fout opgetreden bij het verwijderen van tags.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton onClick={() => navigate(`/tags/new?${searchParams.toString()}`)} ariaLabel="Nieuwe tag" />
        }
      >
        Tags
      </ListHeading>

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <>
          <ListView
            data={data?.items || []}
            totalItems={data?.totalItems || 0}
            headerColumns={HEADER_COLUMNS}
            defaultSortField="name"
            defaultSortDirection="asc"
            emptyMessage="Geen tags gevonden."
            onClick={(tag) => navigate(`/tags/${tag.id}?${searchParams.toString()}`)}
            onEdit={(tag) => navigate(`/tags/${tag.id}/edit?${searchParams.toString()}`)}
            onDelete={handleDelete}
            onQueryChange={handleQueryChange}
            enableSelection={true}
            onBulkDelete={handleBulkDelete}
            bulkDeleteText="Verwijder geselecteerde tags"
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

export default TagList;
