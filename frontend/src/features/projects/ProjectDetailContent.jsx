import { useEffect, useState } from "react";
import { AddButton } from "../../components/Button";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailBlock, { Label, Row, Value } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import { ListView } from "../../components/List/ListView";
import AddActionModal from "../actions/AddActionModal";
import { useUpdateBsAction } from "../../hooks/crudResourceHooks";
import { getActionsByProject } from "../../services/bsActionService";
import { formatDateTime } from "../../utils/dateTimeUtils";

const STATUS_LABELS = { open: "Open", active: "Actief", closed: "Afgesloten" };
const STATUS_COLORS = {
  open: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const ACTION_STATE_LABELS = { open: "Open", in_progress: "In uitvoering", closed: "Afgesloten" };
const ACTION_STATE_COLORS = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  closed: "bg-green-100 text-gray-800 dark:bg-green-900/40 dark:text-green-300",
};

/**
 * Shared project detail content used by both ProjectDetail (page) and ProjectDetailModal.
 *
 * @param {Object} project — the project record
 * @param {string} id      — project record ID
 */
const ProjectDetailContent = ({ project, id }) => {
  const updateBsActionMutation = useUpdateBsAction();
  const [addActionModalOpen, setAddActionModalOpen] = useState(false);
  const [connectedActions, setConnectedActions] = useState([]);
  const [connectedActionsLoading, setConnectedActionsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setConnectedActionsLoading(true);
    getActionsByProject(id)
      .then(setConnectedActions)
      .catch((e) => console.error("Error loading connected actions:", e))
      .finally(() => setConnectedActionsLoading(false));
  }, [id]);

  const handleActionStateChange = async (item, newState) => {
    if (item.state === newState) return;
    try {
      await updateBsActionMutation.mutateAsync({ id: item.id, data: { state: newState } });
      setConnectedActions((prev) => prev.map((a) => (a.id === item.id ? { ...a, state: newState } : a)));
    } catch (e) {
      console.error("Error updating action state:", e);
    }
  };

  const buildConnectedActionsColumns = (onStateChange) => [
    { label: "Naam", width: "40%", field: "name", sortable: true, mobilePosition: "title" },
    {
      label: "Status",
      width: "20%",
      field: "state",
      render: (item) => (
        <select
          value={item.state || "open"}
          onChange={(e) => onStateChange(item, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={`px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${ACTION_STATE_COLORS[item.state] || ACTION_STATE_COLORS.open}`}
        >
          {Object.entries(ACTION_STATE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      ),
      sortable: true,
      mobilePosition: "right",
    },
    {
      label: "Toegewezen aan",
      width: "25%",
      field: "assigned_to",
      render: (item) => item.expand?.assigned_to?.name || "-",
      sortable: false,
      mobilePosition: "info",
    },
    {
      label: "Datum",
      width: "15%",
      field: "datetime",
      render: (item) => (item.datetime ? new Date(item.datetime).toLocaleDateString("nl-NL") : "-"),
      sortable: true,
      mobilePosition: "info",
    },
  ];

  return (
    <div className="space-y-6">
      <DetailCard title="Projectgegevens">
        <DetailBlock>
          <Row>
            <Label>Status</Label>
            <Value>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[project.state] || STATUS_COLORS.open}`}>
                {STATUS_LABELS[project.state] || project.state}
              </span>
            </Value>
          </Row>
          <Row>
            <Label>Aangemaakt</Label>
            <Value>{formatDateTime(project.created)}</Value>
          </Row>
          {project.updated && project.updated !== project.created && (
            <Row>
              <Label>Laatst gewijzigd</Label>
              <Value>{formatDateTime(project.updated)}</Value>
            </Row>
          )}
        </DetailBlock>
      </DetailCard>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="glass-header px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">Acties</h3>
          <AddButton onClick={() => setAddActionModalOpen(true)} showText ariaLabel="Actie toevoegen" />
        </div>
        <div className="p-4">
          {connectedActionsLoading && <CenteredSpinner />}
          {!connectedActionsLoading && (
            <ListView
              data={connectedActions}
              headerColumns={buildConnectedActionsColumns(handleActionStateChange)}
              headerType="simple"
              emptyMessage="Geen acties gekoppeld aan dit project."
            />
          )}
        </div>
      </div>

      <AddActionModal
        open={addActionModalOpen}
        onClose={() => setAddActionModalOpen(false)}
        projectId={id}
        onSave={(action) => setConnectedActions((prev) => [...prev, action])}
      />
    </div>
  );
};

export default ProjectDetailContent;
