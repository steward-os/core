import { useCallback, useEffect, useState } from "react";
import { Button } from "../../components/Button/Button";
import FormFieldSelectAjax from "../../components/Form/FormFieldSelectAjax";
import { ListView } from "../../components/List/ListView";
import ActionDetailModal from "./ActionDetailModal";
import { createBsAction } from "../../services/bsActionService";
import pb from "../../pb";

const STATE_LABELS = { open: "Open", in_progress: "In uitvoering", closed: "Afgesloten" };
const STATE_COLORS = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-800",
};

const COLUMNS = [
  {
    label: "Actie",
    width: "45%",
    field: "expand.action.name",
    render: (conn) => conn.expand?.action?.name || "-",
    mobilePosition: "title",
  },
  {
    label: "Status",
    width: "20%",
    field: "expand.action.state",
    render: (conn) => {
      const state = conn.expand?.action?.state;
      if (!state) return "-";
      return (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATE_COLORS[state] || STATE_COLORS.open}`}
        >
          {STATE_LABELS[state] || state}
        </span>
      );
    },
    mobilePosition: "right",
  },
  {
    label: "Toegewezen aan",
    width: "25%",
    field: "expand.action.assigned_to",
    render: (conn) => conn.expand?.action?.expand?.assigned_to?.name || "-",
    mobilePosition: "info",
  },
];

/**
 * Shows existing action connections for a record and allows adding/removing them.
 *
 * @param {string}    connectionModel  — e.g. "bs_meetings", "bs_projects", "bs_relations"
 * @param {string}    connectionId     — ID of the current record
 * @param {string}    [label]          — display name of the current record (stored on the connection)
 */
const AttachActionForm = ({ connectionModel, connectionId, label }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ action: "" });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [modalActionId, setModalActionId] = useState(null);

  const fetchConnections = useCallback(async () => {
    if (!connectionId) return;
    setLoading(true);
    try {
      const records = await pb.collection("bs_action_connections").getFullList({
        filter: `connection_model = "${connectionModel}" && connection_id = "${connectionId}"`,
        expand: "action,action.assigned_to",
        requestKey: null,
      });
      setConnections(records);
    } catch (err) {
      console.error("Error fetching action connections:", err);
    } finally {
      setLoading(false);
    }
  }, [connectionModel, connectionId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.action && !searchTerm) return;
    setSaving(true);
    try {
      let actionId = formData.action;
      if (!actionId && searchTerm) {
        const newAction = await createBsAction({ name: searchTerm, state: "open" });
        actionId = newAction.id;
        setFormData({ action: actionId });
      }
      await pb.collection("bs_action_connections").create({
        action: actionId,
        connection_model: connectionModel,
        connection_id: connectionId,
        label: label || "",
      });
      setFormData({ action: "" });
      setSearchTerm("");
      setResetKey((k) => k + 1);
      await fetchConnections();
    } catch (err) {
      console.error("Error attaching action:", err);
      alert("Er is een fout opgetreden bij het opslaan van de koppeling.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (connectionRecordId) => {
    try {
      await pb.collection("bs_action_connections").delete(connectionRecordId);
      setConnections((prev) => prev.filter((c) => c.id !== connectionRecordId));
    } catch (err) {
      console.error("Error removing action connection:", err);
      alert("Er is een fout opgetreden bij het verwijderen van de koppeling.");
    }
  };

  return (
    <div className="m-5 space-y-3">
      {loading && <p className="text-sm text-gray-500 px-4 py-2">Laden...</p>}

      {!loading && (
        <ListView
          data={connections}
          headerColumns={COLUMNS}
          headerType="simple"
          emptyMessage="Geen acties gekoppeld."
          onClick={(conn) => setModalActionId(conn.expand?.action?.id || conn.action)}
          onDelete={handleDelete}
        />
      )}

      <ActionDetailModal
        open={!!modalActionId}
        id={modalActionId}
        onClose={() => setModalActionId(null)}
        onEdit={() => setModalActionId(null)}
      />

      <form onSubmit={handleAdd} className="flex gap-2 items-end pt-4">
        <FormFieldSelectAjax
          name="action"
          collection="bs_actions"
          query={{ sort: "-created" }}
          searchFields={["name"]}
          optionDisplay="name"
          formData={formData}
          setFormData={setFormData}
          onSearchTermChange={setSearchTerm}
          resetSignal={resetKey}
          placeholder="Zoek of maak actie aan..."
          className="relative flex-1"
          create={(name) => createBsAction({ name, state: "open" })}
        />
        <Button
          type="submit"
          disabled={saving || (!formData.action && !searchTerm)}
          color="blue"
          text={saving ? "..." : "Koppelen"}
          className="shrink-0 px-4 py-2 font-medium rounded-lg"
        />
      </form>
    </div>
  );
};

export default AttachActionForm;
