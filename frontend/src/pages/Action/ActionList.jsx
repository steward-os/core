import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ActionEditModal from "../../features/actions/ActionEditModal";
import CenteredAlert from "../../components/CenteredAlert";
import { AddButton } from "../../components/Button";
import { FilterRow, ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import Tabs from "../../components/Tabs";
import {
  useDeleteBsAction,
  useDeleteBsActionWithConfirm,
  useBsActions,
  useUpdateBsAction,
} from "../../hooks/crudResourceHooks";
import TagList from "../../components/TagList";
import pb from "../../pb";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATE_LABELS = { open: "Open", in_progress: "In uitvoering", closed: "Afgesloten" };
const STATE_COLORS = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const TABS = [
  { id: "flat", label: "Alle acties" },
  { id: "by_meeting", label: "Per vergadering" },
  { id: "by_project", label: "Per project" },
];

const STATE_FILTER_OPTIONS = [
  { value: "all", label: "Alle statussen" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In uitvoering" },
  { value: "closed", label: "Afgesloten" },
];

const ASSIGNMENT_FILTER_OPTIONS = [
  { value: "all", label: "Alle acties" },
  { value: "my_actions", label: "Mijn acties" },
];

// ─── Column builders ─────────────────────────────────────────────────────────

const buildBaseColumns = (onStateChange) => [
  {
    label: "Aangemaakt",
    width: "10%",
    field: "datetime",
    render: (item) => (item.datetime ? new Date(item.datetime).toLocaleDateString("nl-NL") : "-"),
    sortable: true,
    mobilePosition: "info",
  },
  {
    label: "Gewijzigd",
    width: "10%",
    field: "updated",
    render: (item) => (item.updated ? new Date(item.updated).toLocaleDateString("nl-NL") : "-"),
    sortable: true,
  },
  {
    label: "Naam",
    width: "40%",
    field: "name",
    sortable: true,
    mobilePosition: "title",
  },
  {
    label: "Status",
    width: "15%",
    field: "state",
    render: (item) => (
      <select
        value={item.state || "open"}
        onChange={(e) => onStateChange(item, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className={`px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${STATE_COLORS[item.state] || STATE_COLORS.open}`}
      >
        {Object.entries(STATE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    ),
    sortable: true,
    mobilePosition: "right",
  },
  {
    label: "Toegewezen aan",
    width: "20%",
    field: "assigned_to",
    render: (item) => item.expand?.assigned_to?.name || "-",
    sortable: false,
    mobilePosition: "info",
  },
  {
    label: "Tags",
    width: "15%",
    field: "tags",
    sortable: false,
    mobilePosition: "info",
    render: (item) => <TagList tags={item.expand?.tags} />,
  },
];

const buildHeaderColumnsFlat = (onStateChange) => [...buildBaseColumns(onStateChange)];

const buildHeaderColumnsByMeeting = (onStateChange) => [
  {
    width: "0%",
    field: "datetime",
    category: "expanded",
    categorySort: "datetime desc",
    sortable: false,
    mobilePosition: "info",
    render: (item) => {
      const conn = (item.expand?.bs_action_connections_via_action || []).find(
        (c) => c.connection_model === "bs_meetings",
      );
      return conn?.label || null;
    },
  },
  ...buildBaseColumns(onStateChange),
];

const buildHeaderColumnsByProject = (onStateChange) => [
  {
    width: "0%",
    field: "datetime",
    category: "expanded",
    categorySort: "datetime desc",
    sortable: false,
    mobilePosition: "info",
    render: (item) => {
      const conn = (item.expand?.bs_action_connections_via_action || []).find(
        (c) => c.connection_model === "bs_projects",
      );
      return conn?.label || null;
    },
  },
  ...buildBaseColumns(onStateChange),
];

// ─── Component ───────────────────────────────────────────────────────────────

const ActionList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState({ sortField: "created", sortDirection: "desc", filters: {} });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();

  const openEdit = (item) => {
    setEditingId(item.id);
    setEditModalOpen(true);
  };
  const openDetail = (item) => navigate(`/actions/${item.id}?${searchParams.toString()}`);
  const handleModalSave = () => queryClient.invalidateQueries({ queryKey: ["bsActions"] });

  // URL-persisted filters & tab
  const activeTab = searchParams.get("tab") || "flat";
  const setActiveTab = (tab) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      },
      { replace: true },
    );

  const stateFilter = searchParams.get("stateFilter") || "all";
  const setStateFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("stateFilter");
    else next.set("stateFilter", value);
    setSearchParams(next);
  };

  const assignmentFilter = searchParams.get("assignmentFilter") || "all";
  const setAssignmentFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("assignmentFilter");
    else next.set("assignmentFilter", value);
    setSearchParams(next);
  };

  // Mutations & handlers
  const updateActionMutation = useUpdateBsAction();
  const handleDelete = useDeleteBsActionWithConfirm();
  const deleteActionMutation = useDeleteBsAction();

  const handleStateChange = async (item, newState) => {
    if (item.state === newState) return;
    try {
      await updateActionMutation.mutateAsync({ id: item.id, data: { state: newState } });
      queryClient.invalidateQueries({ queryKey: ["bsActions"] });
    } catch (e) {
      console.error("Error updating action state:", e);
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    await Promise.all(Array.from(selectedIds).map((id) => deleteActionMutation.mutateAsync(id)));
  };

  // Columns (depend on tab + state change handler)
  let headerColumns;
  switch (activeTab) {
    case "by_meeting":
      headerColumns = buildHeaderColumnsByMeeting(handleStateChange);
      break;
    case "by_project":
      headerColumns = buildHeaderColumnsByProject(handleStateChange);
      break;
    default:
      headerColumns = buildHeaderColumnsFlat(handleStateChange);
  }

  // Data fetching (filter conditions -> query options -> fetch)
  const currentUserId = pb.authStore.record?.id;
  const extraConditions = [
    ...(stateFilter !== "all" ? [`state = "${stateFilter}"`] : []),
    ...(assignmentFilter === "my_actions" && currentUserId ? [`assigned_to = "${currentUserId}"`] : []),
  ];
  const { queryOptions } = useSmartTagFilter({ query, headerColumns, extraConditions });
  const { data, isLoading, error } = useBsActions(1, 100, {
    ...queryOptions,
    expand: "assigned_to,tags,bs_action_connections_via_action",
  });

  const openNew = () => {
    setEditingId(null);
    setEditModalOpen(true);
  };

  return (
    <ListContainer fullWidth>
      <ListHeading button={<AddButton onClick={openNew} ariaLabel="Nieuwe actie" />}>Acties</ListHeading>
      <SmartSearch searchFields={["name"]} placeholder="Zoek op naam..." />
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          key={activeTab}
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={headerColumns}
          defaultSortField="created"
          defaultSortDirection="desc"
          emptyMessage="Geen acties gevonden."
          onClick={openDetail}
          onEdit={openEdit}
          onDelete={handleDelete}
          onQueryChange={setQuery}
          filterRow={
            <div className="flex flex-wrap items-center gap-4">
              <FilterRow options={STATE_FILTER_OPTIONS} value={stateFilter} onChange={setStateFilter} />
              <div className="hidden sm:block w-0.5 h-4 bg-gray-300 dark:bg-gray-600" />
              <FilterRow
                options={ASSIGNMENT_FILTER_OPTIONS}
                value={assignmentFilter}
                onChange={setAssignmentFilter}
                variant="select"
              />
            </div>
          }
          enableSelection={true}
          onBulkDelete={handleBulkDelete}
          bulkDeleteText="Verwijder geselecteerde acties"
        />
      )}

      <ActionEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        id={editingId}
        onSave={handleModalSave}
      />
    </ListContainer>
  );
};

export default ActionList;
