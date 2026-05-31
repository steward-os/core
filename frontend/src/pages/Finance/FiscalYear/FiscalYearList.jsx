import { LockClosedIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../../components/Button";
import { Button } from "../../../components/Button/Button";
import CenteredAlert from "../../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../../components/List";
import { ListView } from "../../../components/List/ListView";
import { useFiscalYears } from "../../../hooks/crudResourceHooks";
import { buildFetchOptions } from "../../../hooks/utils/useColumnFilters";
import { generateGnuCash } from "../../../utils/gnucashGenerator";
import { fetchXAFData } from "../../../services/xafExportService";
import { deleteFiscalYearWithAllData, reopenYear } from "../../../services/yearCloseService";
import { generateXAF } from "../../../utils/xafGenerator";
import { generateFakeAdministratie } from "../../../utils/fakeAdminGenerator";
import CloseYearDialog from "./CloseYearDialog";
import DemoAdminDialog from "../LedgerAccount/DemoAdminDialog";

const FiscalYearList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState({ sortField: "start_date", sortDirection: "desc", filters: {} });
  const [closeDialogYear, setCloseDialogYear] = useState(null);
  const [exportingId, setExportingId] = useState(null);
  const [exportingGnuCashId, setExportingGnuCashId] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [demoEvents, setDemoEvents] = useState([]);
  const [showDemoDialog, setShowDemoDialog] = useState(false);

  const handleExportXAF = async (item) => {
    setExportingId(item.id);
    try {
      const data = await fetchXAFData(item.id);
      const xml = generateXAF(data);
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `XAF-${item.year_name}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export mislukt: ${err.message}`);
    } finally {
      setExportingId(null);
    }
  };

  const handleExportGnuCash = async (item) => {
    setExportingGnuCashId(item.id);
    try {
      const data = await fetchXAFData(item.id);
      const xml = generateGnuCash(data);
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GnuCash-${item.year_name}.gnucash`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export mislukt: ${err.message}`);
    } finally {
      setExportingGnuCashId(null);
    }
  };

  const handleGenerateDemo = async (item) => {
    if (
      !window.confirm(
        `Demo data aanmaken voor "${item.year_name}"? Alle bestaande boekingen voor dit jaar worden verwijderd.`,
      )
    )
      return;
    setGeneratingId(item.id);
    try {
      const events = await generateFakeAdministratie(item);
      queryClient.invalidateQueries();
      setDemoEvents(events);
      setShowDemoDialog(true);
    } catch (err) {
      alert(`Fout: ${err.message}`);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleReopen = async (item) => {
    if (
      !window.confirm(
        `Weet je zeker dat je boekjaar "${item.year_name}" wilt heropenen? De afsluitboeking wordt verwijderd.`,
      )
    )
      return;
    try {
      await reopenYear(item.id);
      queryClient.invalidateQueries({ queryKey: ["fiscalYears"] });
      queryClient.invalidateQueries({ queryKey: ["journalTransactions"] });
    } catch (err) {
      alert(`Heropenen mislukt: ${err.message}`);
    }
  };

  const HEADER_COLUMNS = [
    {
      label: "Naam",
      width: "20%",
      field: "year_name",
      sortable: true,
      filter: "year_name",
      mobilePosition: "title",
    },
    {
      label: "Startdatum",
      width: "15%",
      field: "start_date",
      sortable: true,
      render: (item) => item.start_date?.slice(0, 10) || "-",
      mobilePosition: "info",
    },
    {
      label: "Einddatum",
      width: "15%",
      field: "end_date",
      sortable: true,
      render: (item) => item.end_date?.slice(0, 10) || "-",
    },
    {
      label: "Status",
      width: "15%",
      field: "is_locked",
      sortable: false,
      render: (item) =>
        item.is_locked ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            <LockClosedIcon className="w-3 h-3" />
            Gesloten
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Open
          </span>
        ),
    },
    {
      label: "",
      width: "18%",
      field: "close_action",
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-2">
          {item.is_locked ? (
            <Button
              text="Heropenen"
              color="yellow"
              onClick={(e) => {
                e.stopPropagation();
                handleReopen(item);
              }}
            />
          ) : (
            <Button
              text="Jaar afsluiten"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
                setCloseDialogYear(item);
              }}
            />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeepDelete(item);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded transition-colors"
            title="Boekjaar en alle data verwijderen"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
    {
      label: "",
      width: "25%",
      field: "export_action",
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Button
            text={generatingId === item.id ? "Bezig..." : "Demo data"}
            color="red"
            onClick={(e) => {
              e.stopPropagation();
              handleGenerateDemo(item);
            }}
            disabled={!!generatingId || exportingId === item.id || exportingGnuCashId === item.id}
          />
          <Button
            text={exportingId === item.id ? "Bezig..." : "Export XAF"}
            color="blue"
            onClick={(e) => {
              e.stopPropagation();
              handleExportXAF(item);
            }}
            disabled={exportingId === item.id || exportingGnuCashId === item.id || !!generatingId}
          />
          <Button
            text={exportingGnuCashId === item.id ? "Bezig..." : "GnuCash"}
            color="gray"
            onClick={(e) => {
              e.stopPropagation();
              handleExportGnuCash(item);
            }}
            disabled={exportingId === item.id || exportingGnuCashId === item.id || !!generatingId}
          />
        </div>
      ),
    },
  ];

  const handleDeepDelete = async (item) => {
    if (
      !window.confirm(
        `Weet je zeker dat je boekjaar "${item.year_name}" wilt verwijderen?\n\nAlle boekingen, journaalposten en bankafschriftregels van dit boekjaar worden permanent verwijderd. Dit kan niet ongedaan worden gemaakt.`,
      )
    )
      return;
    try {
      await deleteFiscalYearWithAllData(item.id);
      queryClient.invalidateQueries({ queryKey: ["fiscalYears"] });
      queryClient.invalidateQueries({ queryKey: ["journalTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["bankStatementLines"] });
    } catch (err) {
      alert(`Verwijderen mislukt: ${err.message}`);
    }
  };

  const queryOptions = buildFetchOptions(query, HEADER_COLUMNS);
  const { data, isLoading, error } = useFiscalYears(1, 100, queryOptions);

  return (
    <>
      <ListContainer fullWidth>
        <ListHeading
          button={
            <AddButton
              onClick={() => navigate(`/finance/fiscal-years/new?${searchParams.toString()}`)}
              ariaLabel="Nieuw boekjaar"
            />
          }
        >
          Boekjaren
        </ListHeading>

        {isLoading && <CenteredAlert text="Laden..." />}
        {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
        {!isLoading && !error && (
          <ListView
            data={data?.items || []}
            totalItems={data?.totalItems || 0}
            headerColumns={HEADER_COLUMNS}
            defaultSortField="start_date"
            defaultSortDirection="desc"
            emptyMessage="Geen boekjaren gevonden."
            onEdit={(item) => navigate(`/finance/fiscal-years/${item.id}/edit?${searchParams.toString()}`)}
            onQueryChange={setQuery}
          />
        )}

        <CloseYearDialog
          open={!!closeDialogYear}
          fiscalYear={closeDialogYear}
          onClose={() => setCloseDialogYear(null)}
        />
      </ListContainer>

      <DemoAdminDialog open={showDemoDialog} onClose={() => setShowDemoDialog(false)} events={demoEvents} />
    </>
  );
};

export default FiscalYearList;
