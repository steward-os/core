import React, { useEffect, useState } from "react";
import { Button } from "../../components/Button/Button";
import Input from "../../components/Form/Input";
import Textarea from "../../components/Form/Textarea";
import Label from "../../components/Form/Label";
import Select from "../../components/Form/Select";
import DialogPanel from "../../components/Modal/DialogPanel";
import { updateMeetingTopic, createMeetingTopic, deleteMeetingTopic } from "../../services/meetingService";
import { getUsers } from "../../services/userService";
import UpdatesSection from "../../components/Remarks/UpdatesSection";

const EditMeetingTopicDialog = ({ open, onClose, topic, meetingId, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    contributor: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (topic && open) {
      setFormData({
        name: topic.name || "",
        description: topic.description || "",
        contributor: topic.contributor || "",
      });
    } else if (open && !topic) {
      setFormData({
        name: "",
        contributor: "",
      });
    }
  }, [topic, open]);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersData = await getUsers({
        sort: "name",
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
    setLoadingUsers(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contributor) return;

    setSaving(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description || "",
        contributor: formData.contributor || null,
      };

      if (topic?.id) {
        // Update existing topic
        await updateMeetingTopic(topic.id, submitData);
      } else if (meetingId) {
        // Create new topic
        submitData.meeting = meetingId;
        await createMeetingTopic(submitData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving meeting topic:", error);
    }
    setSaving(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDelete = async () => {
    if (!topic?.id) return;

    if (!window.confirm(`Weet je zeker dat je "${topic.name}" wilt verwijderen?`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteMeetingTopic(topic.id);
      onSave();
      onClose();
    } catch (error) {
      console.error("Error deleting meeting topic:", error);
      alert("Er is een fout opgetreden bij het verwijderen van het agendapunt.");
    }
    setDeleting(false);
  };

  return (
    <DialogPanel open={open} onClose={onClose} title={topic?.id ? "Agendapunt bewerken" : "Nieuw agendapunt"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" required>
            Titel
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Titel van het agendapunt"
            required
          />
        </div>

        <div>
          <Label htmlFor="contributor" required>Indiener</Label>
          <Select
            id="contributor"
            name="contributor"
            value={formData.contributor}
            onChange={handleInputChange}
            disabled={loadingUsers}
            required
          >
            <option value="">Selecteer indiener</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
          {loadingUsers && <p className="text-gray-500 mt-1">Gebruikers laden...</p>}
        </div>

        <div>
          <Label htmlFor="description" required>
            Toelichting
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Toelichting bij het agendapunt"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <div className="flex-1" />
          <Button
            type="button"
            onClick={onClose}
            color="gray"
            text="Annuleren"
            className="px-4 py-2 font-medium rounded-lg"
          />
          <Button
            type="submit"
            disabled={saving || !formData.name.trim() || !formData.contributor}
            color="blue"
            text={saving ? "Opslaan..." : "Opslaan"}
            className="px-4 py-2 font-medium rounded-lg"
          />
          {topic?.id && (
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              color="red"
              text={deleting ? "Verwijderen..." : "Verwijderen"}
              className="px-4 py-2 font-medium rounded-lg"
            />
          )}
        </div>
      </form>

      {topic?.id && (
        <div className="border-t mt-4 pt-4">
          <UpdatesSection
            entityType="bs_meeting_topics"
            entityId={topic.id}
            showCard={false}
            title="Opmerkingen"
            placeholder="Voeg een opmerking toe..."
          />
        </div>
      )}
    </DialogPanel>
  );
};

export default EditMeetingTopicDialog;
