import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../../components/Button";
import CenteredAlert from "../../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../../components/List";
import { ListView } from "../../../components/List/ListView";
import { SimplePaginator } from "../../../components/List/SimplePaginator";
import SmartSearch from "../../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../../components/List/useSmartTagFilter";
import { useDeleteMember, useDeleteMemberWithConfirm, useMembers } from "../../../hooks/crudResourceHooks";
import { useRelationTags } from "../../../hooks/useRelationTagQuery";
import { usePagination } from "../../../hooks/utils/usePagination";
import BatchInvoiceDialog from "../../Relation/BatchInvoiceDialog";
import SepaDialog from "./SepaDialog";

const HEADER_COLUMNS = [
  {
    label: "Achternaam",
    width: "20%",
    field: "last_name",
    sortable: true,
    filter: "last_name",
    mobilePosition: "title",
  },
  {
    label: "Voornaam",
    width: "20%",
    field: "first_name",
    sortable: true,
    filter: "first_name",
    mobilePosition: "title",
  },
  {
    label: "E-mail",
    width: "35%",
    field: "email",
    render: (member) => {
      return member.email ? (
        <a href={`mailto:${member.email}`} className="text-blue-600 hover:text-blue-800">
          {member.email}
        </a>
      ) : (
        "-"
      );
    },
    sortable: true,
    filter: "email",
    mobilePosition: "info",
  },
  {
    label: "Plaats",
    width: "25%",
    field: "city",
    sortable: true,
    filter: "city",
    mobilePosition: "info",
  },
];

const MemberList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState({ sortField: "last_name", sortDirection: "asc", filters: {} });
  const [isSepaDialogOpen, setIsSepaDialogOpen] = useState(false);
  const [sepaSelectedIds, setSepaSelectedIds] = useState([]);
  const [isBatchInvoiceDialogOpen, setIsBatchInvoiceDialogOpen] = useState(false);
  const [selectedIdsForInvoice, setSelectedIdsForInvoice] = useState([]);

  const { queryOptions, conditionsKey } = useSmartTagFilter({
    query,
    headerColumns: HEADER_COLUMNS,
    baseOptions: { expand: "tags" },
  });

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

  const { data, isLoading, error } = useMembers(currentPage, perPage, queryOptions);
  const handleDelete = useDeleteMemberWithConfirm();
  const deleteMemberMutation = useDeleteMember();

  const handleBulkDelete = async (selectedIds) => {
    const deletePromises = Array.from(selectedIds).map((memberId) => deleteMemberMutation.mutateAsync(memberId));
    await Promise.all(deletePromises);
  };

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

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton
            onClick={() => navigate(`/finance/members/new?${searchParams.toString()}`)}
            ariaLabel="Nieuw lid"
          />
        }
      >
        Ledenadministratie
      </ListHeading>

      <SmartSearch
        availableTags={availableTags}
        searchFields={["last_name", "first_name", "email", "city"]}
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
            emptyMessage="Geen leden gevonden."
            onClick={(member) => navigate(`/finance/members/${member.id}?${searchParams.toString()}`)}
            onEdit={(member) => navigate(`/finance/members/${member.id}/edit?${searchParams.toString()}`)}
            onDelete={handleDelete}
            onQueryChange={handleQueryChange}
            enableSelection={true}
            onBulkDelete={handleBulkDelete}
            bulkDeleteText="Verwijder geselecteerde leden"
            renderBulkActions={(selectedIds) => (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSepaSelectedIds(selectedIds);
                    setIsSepaDialogOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Maak SEPA bestand
                </button>
                <button
                  onClick={() => {
                    setSelectedIdsForInvoice(selectedIds);
                    setIsBatchInvoiceDialogOpen(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Maak verkoopfactuur
                </button>
              </div>
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
          <SepaDialog
            open={isSepaDialogOpen}
            onClose={() => setIsSepaDialogOpen(false)}
            selectedIds={sepaSelectedIds}
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

export default MemberList;
