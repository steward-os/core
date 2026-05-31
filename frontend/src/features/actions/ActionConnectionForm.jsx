import { useCallback, useEffect, useState } from "react";
import { Button } from "../../components/Button/Button";
import FormFieldSelectAjax from "../../components/Form/FormFieldSelectAjax";
import Label from "../../components/Form/Label";
import Select from "../../components/Form/Select";
import { ListView } from "../../components/List/ListView";
import MeetingDetailModal from "../meetings/MeetingDetailModal";
import ProjectDetailModal from "../projects/ProjectDetailModal";
import RelationDetailModal from "../relations/RelationDetailModal";
import pb from "../../pb";

const CONNECTION_MODEL_OPTIONS = [
  {
    value: "bs_meetings",
    label: "Vergadering",
    collection: "bs_meetings",
    sort: "name",
    searchFields: ["name"],
    optionDisplay: "name",
    getLabel: (r) => r.name || "",
    route: "/meetings",
  },
  {
    value: "bs_projects",
    label: "Project",
    collection: "bs_projects",
    sort: "name",
    searchFields: ["name"],
    optionDisplay: "name",
    getLabel: (r) => r.name || "",
    route: "/projects",
  },
  {
    value: "bs_relations",
    label: "Relatie",
    collection: "bs_relations",
    sort: "last_name,first_name",
    searchFields: ["first_name", "last_name"],
    optionDisplay: (r) => [r.first_name, r.last_name].filter(Boolean).join(" "),
    getLabel: (r) => [r.first_name, r.last_name].filter(Boolean).join(" "),
    route: "/relations",
  },
];

const COLUMNS = [
  {
    label: "Type",
    width: "25%",
    field: "connection_model",
    render: (conn) =>
      CONNECTION_MODEL_OPTIONS.find((m) => m.value === conn.connection_model)?.label || conn.connection_model,
    mobilePosition: "info",
  },
  {
    label: "Naam",
    field: "label",
    render: (conn) => conn.label || conn.connection_id,
    mobilePosition: "title",
  },
];

/**
 * Shows existing connections for an action and allows adding/removing them.
 *
 * @param {string}  actionId  — the action record ID
 */
const ActionConnectionForm = ({ actionId }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relationModalId, setRelationModalId] = useState(null);
  const [meetingModalId, setMeetingModalId] = useState(null);
  const [projectModalId, setProjectModalId] = useState(null);
  const [selectedModel, setSelectedModel] = useState("bs_meetings");
  const [formData, setFormData] = useState({ connection_id: "" });
  const [saving, setSaving] = useState(false);

  const modelConfig = CONNECTION_MODEL_OPTIONS.find((m) => m.value === selectedModel);

  const fetchConnections = useCallback(async () => {
    if (!actionId) return;
    setLoading(true);
    try {
      const records = await pb.collection("bs_action_connections").getFullList({
        filter: `action = "${actionId}" && connection_model != "bs_notes"`,
        requestKey: null,
      });
      setConnections(records);
    } catch (err) {
      console.error("Error fetching action connections:", err);
    } finally {
      setLoading(false);
    }
  }, [actionId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
    setFormData({ connection_id: "" });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.connection_id) return;
    setSaving(true);
    try {
      const record = await pb.collection(modelConfig.collection).getOne(formData.connection_id, { requestKey: null });
      await pb.collection("bs_action_connections").create({
        action: actionId,
        connection_model: selectedModel,
        connection_id: formData.connection_id,
        label: modelConfig.getLabel(record),
      });
      setFormData({ connection_id: "" });
      await fetchConnections();
    } catch (err) {
      console.error("Error creating action connection:", err);
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
      {loading && <p className="text-sm text-gray-500">Laden...</p>}

      {!loading && (
        <ListView
          data={connections}
          headerColumns={COLUMNS}
          headerType="simple"
          emptyMessage="Geen koppelingen."
          onClick={(conn) => {
            if (conn.connection_model === "bs_relations") setRelationModalId(conn.connection_id);
            else if (conn.connection_model === "bs_meetings") setMeetingModalId(conn.connection_id);
            else if (conn.connection_model === "bs_projects") setProjectModalId(conn.connection_id);
          }}
          onDelete={handleDelete}
        />
      )}

      <RelationDetailModal
        open={!!relationModalId}
        id={relationModalId}
        onClose={() => setRelationModalId(null)}
        onEdit={() => setRelationModalId(null)}
      />
      <MeetingDetailModal
        open={!!meetingModalId}
        id={meetingModalId}
        onClose={() => setMeetingModalId(null)}
      />
      <ProjectDetailModal
        open={!!projectModalId}
        id={projectModalId}
        onClose={() => setProjectModalId(null)}
        onEdit={() => setProjectModalId(null)}
      />

      <form onSubmit={handleAdd} className="space-y-3 pt-1">
        <div>
          <Label htmlFor="ac-model">Koppel met</Label>
          <Select id="ac-model" value={selectedModel} onChange={handleModelChange}>
            {CONNECTION_MODEL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-2 items-end">
          <FormFieldSelectAjax
            key={selectedModel}
            name="connection_id"
            collection={modelConfig.collection}
            query={{ sort: modelConfig.sort }}
            searchFields={modelConfig.searchFields}
            optionDisplay={modelConfig.optionDisplay}
            formData={formData}
            setFormData={setFormData}
            placeholder={`Zoek ${modelConfig.label.toLowerCase()}...`}
            className="relative flex-1"
          />
          <Button
            type="submit"
            disabled={saving || !formData.connection_id}
            color="blue"
            text={saving ? "..." : "Koppelen"}
            className="shrink-0 px-4 py-2 font-medium rounded-lg"
          />
        </div>
      </form>
    </div>
  );
};

export default ActionConnectionForm;
