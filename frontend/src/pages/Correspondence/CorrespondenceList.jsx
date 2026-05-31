import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import { SimplePaginator } from "../../components/List/SimplePaginator";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import Tabs from "../../components/Tabs";
import TagList from "../../components/TagList";
import InlineTagEditor from "../../components/InlineTagEditor";
import { useCreateEmail, useDeleteEmail, useDeleteEmailWithConfirm, useEmails, useUpdateEmail } from "../../hooks/crudResourceHooks";
import { useAllTags } from "../../hooks/useRelationTagQuery";
import { usePagination } from "../../hooks/utils/usePagination";
import pb from "../../pb";
import { getEmail } from "../../services/emailService";
import { formatDateTime } from "../../utils/dateTimeUtils";
import { generateEmailsBatchPdf } from "../../utils/emailPdfUtils";
import CorrespondenceQuickEditModal from "./CorrespondenceQuickEditModal";
import CreateCorrespondenceModal from "./CreateCorrespondenceModal";
import SetTypeModal from "./SetTypeModal";



const TABS = [
  { id: "grouped", label: "Per topic" },
  { id: "flat", label: "Op datum" },
];

const CorrespondenceList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "grouped";
  const setActiveTab = (tab) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      },
      { replace: true },
    );
  const [query, setQuery] = useState({ sortField: "date", sortDirection: "desc", filters: {} });

  const { data: availableTags } = useAllTags({ sort: "name" });

  const columns = [
    {
      label: "Datum",
      width: "13%",
      field: "date",
      sortable: false,
      mobilePosition: "info",
      render: (email) => formatDateTime(email.date),
    },
    {
      label: "In/uit",
      width: "5%",
      field: "direction",
      sortable: false,
      mobilePosition: "info",
    },
    {
      label: "Naam",
      width: "20%",
      field: "name",
      sortable: false,
      mobilePosition: "title",
    },
    {
      label: "Omschrijving",
      width: "30%",
      field: "description",
      sortable: false,
      mobilePosition: "title",
    },
    {
      label: "Tags",
      width: "10%",
      field: "tags",
      sortable: false,
      mobilePosition: "info",
      render: (email) => (
        <InlineTagEditor
          item={email}
          availableTags={availableTags}
        />
      ),
    },
  ];

  const headerColumns = activeTab === "grouped"
    ? [
      {
        width: "0%",
        field: "topic.title",
        sortable: true,
        mobilePosition: "title",
        category: "expanded",
        categorySort: "date desc",
      },
      ...columns,
    ]
    : columns;

  const { queryOptions, conditionsKey } = useSmartTagFilter({
    query,
    headerColumns,
    baseOptions: { expand: "topic,tags" },
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
  } = usePagination(50);

  useEffect(() => {
    pb.collection("bs_correspondence").subscribe("*", () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    });
    return () => pb.collection("bs_correspondence").unsubscribe("*");
  }, [queryClient]);

  const [isExporting, setIsExporting] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null);
  const [setTypeIds, setSetTypeIds] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const { mutateAsync: updateEmail } = useUpdateEmail();
  const { mutateAsync: createEmail } = useCreateEmail();

  const handleExportPdf = async (selectedIds) => {
    setIsExporting(true);
    try {
      const emails = await Promise.all(selectedIds.map((id) => getEmail(id, { expand: "topic,relation" })));
      await generateEmailsBatchPdf(emails);
    } catch (err) {
      console.error("PDF export mislukt:", err);
      alert("Er is een fout opgetreden bij het exporteren.");
    } finally {
      setIsExporting(false);
    }
  };

  const { data, isLoading, error } = useEmails(currentPage, perPage, queryOptions);
  const handleDelete = useDeleteEmailWithConfirm();
  const { mutateAsync: deleteEmail } = useDeleteEmail();

  useEffect(() => {
    if (data) {
      updatePaginationData(data.items, data.totalItems, Math.ceil(data.totalItems / perPage));
    }
  }, [data, perPage, updatePaginationData]);

  useEffect(() => {
    resetToFirstPage();
  }, [activeTab, conditionsKey, resetToFirstPage]);

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
    resetToFirstPage();
  };

  const handleBulkDelete = async (selectedIds) => {
    await Promise.all(Array.from(selectedIds).map((id) => deleteEmail(id)));
  };

  const handleSetType = async (selectedIds, type) => {
    await Promise.all(Array.from(selectedIds).map((id) => updateEmail({ id, data: { type } })));
  };

  const handleCreate = async (data) => {
    await createEmail(data);
  };

  const handleQuickSave = async (id, data) => {
    await updateEmail({ id, data });
  };

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton onClick={() => setIsCreating(true)} ariaLabel="Nieuwe correspondentie" />
        }
      >
        Correspondentie
      </ListHeading>
      <SmartSearch availableTags={availableTags} searchFields={["subject", "description", "from", "to", "body"]} />
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <>
          <ListView
            key={activeTab}
            data={data?.items || []}
            totalItems={data?.totalItems || 0}
            headerColumns={headerColumns}
            defaultSortField="date"
            defaultSortDirection="desc"
            emptyMessage="Geen correspondentie gevonden."
            onClick={(email) => navigate(`/correspondence/${email.id}`)}
            onDelete={handleDelete}
            onQuickEdit={(email) => setEditingEmail(email)}
            renderHoverTooltip={(email) => {
              if (!email.body) return null;
              const isHtml = /<[a-z][\s\S]*>/i.test(email.body);
              if (isHtml) return <div className="text-xs text-gray-700 line-clamp-6 prose prose-xs max-w-none" dangerouslySetInnerHTML={{ __html: email.body }} />;
              return <span className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-6">{email.body}</span>;
            }}
            onQueryChange={handleQueryChange}
            enableSelection={true}
            onBulkDelete={handleBulkDelete}
            bulkDeleteText="Verwijder geselecteerde post"
            renderBulkActions={(selectedIds) => (
              <>
                <button
                  onClick={() => handleExportPdf(selectedIds)}
                  disabled={isExporting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {isExporting ? "Exporteren..." : "Export als PDF (zip)"}
                </button>
                <button
                  onClick={() => setSetTypeIds(selectedIds)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Type
                </button>
              </>
            )}
          />
          <SimplePaginator
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
          />
        </>
      )}
      <CorrespondenceQuickEditModal email={editingEmail} onClose={() => setEditingEmail(null)} onSave={handleQuickSave} />
      <CreateCorrespondenceModal open={isCreating} onClose={() => setIsCreating(false)} onSave={handleCreate} />
      <SetTypeModal
        open={!!setTypeIds}
        onClose={() => setSetTypeIds(null)}
        onConfirm={(type) => handleSetType(setTypeIds, type)}
      />
    </ListContainer>
  );
};

export default CorrespondenceList;
