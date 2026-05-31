import { LockClosedIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../../components/Button";
import CenteredAlert from "../../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../../components/List";
import { ListView } from "../../../components/List/ListView";
import { useDeleteJournalTransaction, useDeleteJournalTransactionWithConfirm, useJournalTransactions } from "../../../hooks/crudResourceHooks";
import { buildFetchOptions } from "../../../hooks/utils/useColumnFilters";
import { TRANSACTION_TYPE_LABELS } from "../../../utils/financeConstants";

const formatCurrency = (val) =>
  val ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(val) : "-";

const HEADER_COLUMNS = [
  {
    label: "Boekingsnummer",
    width: "15%",
    field: "entry_number",
    sortable: true,
    filter: "entry_number",
    mobilePosition: "title",
  },
  {
    label: "Datum",
    width: "12%",
    field: "transaction_date",
    sortable: true,
    render: (item) => item.transaction_date?.slice(0, 10) || "-",
    mobilePosition: "info",
  },
  {
    label: "Omschrijving",
    width: "35%",
    field: "description",
    sortable: true,
    filter: "description",
    render: (item) => item.description || "-",
  },
  {
    label: "Boekjaar",
    width: "15%",
    field: "fiscal_year",
    sortable: false,
    render: (item) => {
      const year = item.expand?.fiscal_year;
      if (!year) return "-";
      return (
        <span className="flex items-center gap-1">
          {year.is_locked && <LockClosedIcon className="w-3 h-3 text-gray-400" title="Afgesloten boekjaar" />}
          {year.year_name}
        </span>
      );
    },
  },
  {
    label: "Transactie type",
    width: "12%",
    field: "transaction_type",
    sortable: true,
    render: (item) => TRANSACTION_TYPE_LABELS[item.transaction_type] || item.transaction_type || "-",
  },
  {
    label: "Bedrag",
    width: "12%",
    field: "amount",
    sortable: false,
    render: (item) => {
      const entries = item.expand?.fi_journal_entries_via_journal_transaction || [];
      const total = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
      return formatCurrency(total);
    },
  },
];

const JournalTransactionList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState({ sortField: "created", sortDirection: "desc", filters: {} });

  const queryOptions = buildFetchOptions(query, HEADER_COLUMNS, {
    expand: "fiscal_year,fi_journal_entries_via_journal_transaction",
  });
  const { data, isLoading, error } = useJournalTransactions(1, 100, queryOptions);
  const handleDelete = useDeleteJournalTransactionWithConfirm();
  const { mutateAsync: deleteTransaction } = useDeleteJournalTransaction();

  const isItemLocked = (item) => item?.expand?.fiscal_year?.is_locked || item?.is_closing;

  const handleEdit = (item) => {
    if (isItemLocked(item)) return;
    navigate(`/finance/journal-transactions/${item.id}/edit?${searchParams.toString()}`);
  };

  const handleDeleteGuarded = (id) => {
    const item = data?.items?.find((i) => i.id === id);
    if (isItemLocked(item)) return;
    handleDelete(id);
  };

  const handleBulkDelete = async (selectedIds) => {
    const items = data?.items || [];
    await Promise.all(
      Array.from(selectedIds)
        .filter((id) => !isItemLocked(items.find((i) => i.id === id)))
        .map((id) => deleteTransaction(id))
    );
  };

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton
            onClick={() => navigate(`/finance/journal-transactions/new?${searchParams.toString()}`)}
            ariaLabel="Nieuwe boeking"
          />
        }
      >
        Dagboek
      </ListHeading>

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && (
        <div className="m-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
          <p className="font-semibold text-red-700 dark:text-red-400 mb-2">Fout bij laden van boekingen</p>
          <p className="text-red-600 dark:text-red-300 mb-1">{error.message}</p>
          {error.status && <p className="text-red-500 dark:text-red-400">HTTP status: {error.status}</p>}
          {error.response?.message && error.response.message !== error.message && (
            <p className="text-red-500 dark:text-red-400">Server: {error.response.message}</p>
          )}
          {error.response?.data && Object.keys(error.response.data).length > 0 && (
            <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs text-red-700 dark:text-red-300 overflow-auto">
              {JSON.stringify(error.response.data, null, 2)}
            </pre>
          )}
        </div>
      )}
      {!isLoading && !error && (
        <ListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="transaction_date"
          defaultSortDirection="desc"
          emptyMessage="Geen boekingen gevonden."
          onClick={(item) => navigate(`/finance/journal-transactions/${item.id}?${searchParams.toString()}`)}
          onEdit={handleEdit}
          onDelete={handleDeleteGuarded}
          onQueryChange={setQuery}
          enableSelection={true}
          onBulkDelete={handleBulkDelete}
          bulkDeleteText="Verwijder geselecteerde boekingen"
        />
      )}
    </ListContainer>
  );
};

export default JournalTransactionList;
