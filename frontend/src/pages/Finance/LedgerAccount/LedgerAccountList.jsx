import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AddButton } from "../../../components/Button";
import { Button } from "../../../components/Button/Button";
import CenteredAlert from "../../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../../components/List";
import { ListView } from "../../../components/List/ListView";
import {
  useDeleteLedgerAccount,
  useDeleteLedgerAccountWithConfirm,
  useLedgerAccounts,
} from "../../../hooks/crudResourceHooks";
import { buildFetchOptions } from "../../../hooks/utils/useColumnFilters";
import { createLedgerAccount, updateLedgerAccount } from "../../../services/ledgerAccountService";
import { getJournalEntryBalancesByAccountUntilDate } from "../../../services/journalTransactionService";
import { LEDGER_CATEGORY_LABELS, LEDGER_SUB_CATEGORY_LABELS } from "../../../utils/financeConstants";
import { LEDGER_ACCOUNT_SEEDS } from "../../../seeds/ledgerAccounts";
import Label from "../../../components/Form/Label";
import Input from "../../../components/Form/Input";

const getNet = (balance, category) => {
  if (!balance) return 0;
  const debitNormal = category === "ASSETS" || category === "EXPENSES";
  return debitNormal ? balance.totalDebit - balance.totalCredit : balance.totalCredit - balance.totalDebit;
};

const formatBalance = (balance, category) => {
  if (!balance) return "-";
  const net = getNet(balance, category);
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(net);
};

const getFinanceColor = (variance, category) => {
  if (Math.abs(variance) < 0.01) return "text-gray-400";
  const isPositive = variance > 0;
  switch (category) {
    case "ASSETS":
    case "REVENUE":
    case "EQUITY":
      return isPositive ? "text-green-600 font-bold" : "text-red-600";
    case "LIABILITIES":
    case "EXPENSES":
      return isPositive ? "text-red-600" : "text-green-600 font-bold";
    default:
      return "text-gray-900";
  }
};

const STATIC_COLUMNS = [
  {
    label: "Nummer",
    width: "10%",
    field: "account_number",
    sortable: true,
    filter: "account_number",
    mobilePosition: "title",
  },
  {
    label: "Categorie",
    width: "13%",
    field: "category",
    sortable: true,
    filter: "category",
    render: (item) => LEDGER_CATEGORY_LABELS[item.category] || item.category || "-",
  },
  {
    label: "Sub-categorie",
    width: "15%",
    field: "sub_category",
    sortable: true,
    filter: "sub_category",
    render: (item) => LEDGER_SUB_CATEGORY_LABELS[item.sub_category] || item.sub_category || "-",
  },
  {
    label: "Naam",
    width: "22%",
    field: "name",
    sortable: true,
    filter: "name",
    mobilePosition: "info",
  },
];

const LedgerAccountList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState({ sortField: "account_number", sortDirection: "asc", filters: {} });
  const [creating, setCreating] = useState(false);
  const [hideZero, setHideZero] = useState(false);
  const [balances1, setBalances1] = useState({});
  const [balances2, setBalances2] = useState({});
  const [date1, setDate1] = useState(() => {
    const d = new Date();
    const r = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    return `${r.getFullYear()}-${String(r.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [date2, setDate2] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });

  useEffect(() => {
    if (!date1) {
      setBalances1({});
      return;
    }
    getJournalEntryBalancesByAccountUntilDate(date1)
      .then(setBalances1)
      .catch(() => {});
  }, [date1]);

  useEffect(() => {
    if (!date2) {
      setBalances2({});
      return;
    }
    getJournalEntryBalancesByAccountUntilDate(date2)
      .then(setBalances2)
      .catch(() => {});
  }, [date2]);

  const headerColumns = [
    ...STATIC_COLUMNS,
    {
      label: date1 ? `Saldo ${date1}` : "Saldo datum 1",
      width: "12%",
      sortable: false,
      render: (item) => formatBalance(item.balance1, item.category),
    },
    {
      label: date2 ? `Saldo ${date2}` : "Saldo datum 2",
      width: "12%",
      sortable: false,
      render: (item) => formatBalance(item.balance2, item.category),
    },
    {
      label: "Verschil",
      width: "12%",
      sortable: false,
      render: (item) => {
        const net1 = getNet(item.balance1, item.category);
        const net2 = getNet(item.balance2, item.category);
        if (!item.balance1 && !item.balance2) return "-";
        const diff = net2 - net1;
        const color = getFinanceColor(diff, item.category);
        const formatted = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(diff);
        return <span className={color}>{formatted}</span>;
      },
    },
    { label: "", width: "10%", sortable: false },
  ];

  const queryOptions = buildFetchOptions(query, STATIC_COLUMNS);
  const { data, isLoading, error } = useLedgerAccounts(1, 200, queryOptions);
  const handleDelete = useDeleteLedgerAccountWithConfirm();
  const { mutateAsync: deleteLedgerAccount } = useDeleteLedgerAccount();

  const handleBulkDelete = async (selectedIds) => {
    await Promise.all(Array.from(selectedIds).map((id) => deleteLedgerAccount(id)));
  };

  const enriched_data = (data?.items || [])
    .map((account) => ({
      ...account,
      balance1: balances1[account.id],
      balance2: balances2[account.id],
    }))
    .filter((account) => {
      if (!hideZero) return true;
      return getNet(account.balance1, account.category) !== 0 || getNet(account.balance2, account.category) !== 0;
    });

  const handleCreateDefaults = async () => {
    const existing = data?.items || [];
    const existingByNumber = Object.fromEntries(existing.map((a) => [a.account_number, a]));

    function getUpdateData(seed, ex) {
      const updates = {};
      if (seed.sub_category && !ex.sub_category) updates.sub_category = seed.sub_category;
      if (seed.is_bank_account && !ex.is_bank_account) updates.is_bank_account = true;
      if (seed.is_suspense_account && !ex.is_suspense_account) updates.is_suspense_account = true;
      return updates;
    }

    const toCreate = LEDGER_ACCOUNT_SEEDS.filter((a) => !existingByNumber[a.account_number]);
    const toUpdate = LEDGER_ACCOUNT_SEEDS.filter((a) => {
      const ex = existingByNumber[a.account_number];
      return ex && Object.keys(getUpdateData(a, ex)).length > 0;
    });

    if (toCreate.length === 0 && toUpdate.length === 0) {
      alert("Alle standaard rekeningen bestaan al en zijn up-to-date.");
      return;
    }

    const parts = [];
    if (toCreate.length > 0) parts.push(`${toCreate.length} aanmaken`);
    if (toUpdate.length > 0) parts.push(`${toUpdate.length} bijwerken`);
    if (!window.confirm(`Standaard rekeningen: ${parts.join(", ")}?`)) return;

    setCreating(true);
    try {
      for (const account of toCreate) {
        await createLedgerAccount(account);
      }
      for (const account of toUpdate) {
        const ex = existingByNumber[account.account_number];
        await updateLedgerAccount(ex.id, getUpdateData(account, ex));
      }
      queryClient.invalidateQueries({ queryKey: ["ledgerAccounts"] });
    } catch (err) {
      alert(`Mislukt: ${err.message}`);
    }
    setCreating(false);
  };

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <div className="flex gap-2">
            <Button
              text={creating ? "Aanmaken..." : "Standaard aanmaken"}
              color="gray"
              onClick={handleCreateDefaults}
              disabled={creating || isLoading}
            />
            <AddButton
              onClick={() => navigate(`/finance/ledger-accounts/new?${searchParams.toString()}`)}
              ariaLabel="Nieuwe grootboekrekening"
            />
          </div>
        }
      >
        Grootboekrekeningen
      </ListHeading>
      {/* hide for mobile, not usefull and messes up the menu */}
      <div className="hidden md:block flex items-end gap-6 px-4 pb-4">
        <div>
          <Label htmlFor="date1">Datum 1</Label>
          <Input id="date1" type="date" value={date1} onChange={(e) => setDate1(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="date2">Datum 2</Label>
          <Input id="date2" type="date" value={date2} onChange={(e) => setDate2(e.target.value)} />
        </div>
        <div className="flex items-center pb-1">
          <input
            id="hideZero"
            type="checkbox"
            checked={hideZero}
            onChange={(e) => setHideZero(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <Label htmlFor="hideZero" className="ml-2 mb-0">
            Verberg nul-saldi
          </Label>
        </div>
      </div>

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={enriched_data || []}
          totalItems={data?.totalItems || 0}
          headerColumns={headerColumns}
          defaultSortField="account_number"
          defaultSortDirection="asc"
          emptyMessage="Geen grootboekrekeningen gevonden."
          onClick={(item) => navigate(`/finance/ledger-accounts/${item.id}?${searchParams.toString()}`)}
          onEdit={(item) => navigate(`/finance/ledger-accounts/${item.id}/edit?${searchParams.toString()}`)}
          onDelete={handleDelete}
          onQueryChange={setQuery}
          enableSelection={true}
          onBulkDelete={handleBulkDelete}
          bulkDeleteText="Verwijder geselecteerde rekeningen"
        />
      )}
    </ListContainer>
  );
};

export default LedgerAccountList;
