import { XMarkIcon as DeleteIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CloseButton } from "../../components/Button/CloseButton";
import { Button } from "../../components/Button/Button";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import Checkbox from "../../components/Form/Checkbox";
import Input from "../../components/Form/Input";
import GroupDropdown from "../../components/GroupDropdown";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import SectionDropdown from "../../components/SectionDropdown";
import {
  createUser,
  createUserGroupMember,
  deleteUserGroupMember,
  getUser,
  getUserGroupMembers,
  updateUser,
} from "../../services/userService";
import pb from "../../pb";

const ROLES = [
  { field: "leden_app_admin", label: "Admin" },
  { field: "is_session_admin", label: "Agenda beheerder" },
  { field: "leden_app_volunteer_admin", label: "Vrijwilligers beheerder" },
  { field: "leden_app_banner_admin", label: "Banner beheerder" },
  { field: "is_board_member", label: "Bestuurslid" },
  { field: "is_music_recordings_admin", label: "Muziek opnames beheerder" },
  { field: "is_director", label: "Dirigent" },
  { field: "can_send_messages", label: "Kan berichten versturen" },
  { field: "is_finance_admin", label: "Financieel beheerder" },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  leden_app_admin: false,
  leden_app_volunteer_admin: false,
  leden_app_banner_admin: false,
  is_board_member: false,
  is_session_admin: false,
  is_music_recordings_admin: false,
  is_director: false,
  can_send_messages: false,
  is_finance_admin: false,
};

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isNewUser = id === undefined;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [originalFormData, setOriginalFormData] = useState(EMPTY_FORM);
  const [groupMembers, setGroupMembers] = useState([]);
  const [newGroup, setNewGroup] = useState("");
  const [newSection, setNewSection] = useState("");

  const fetchUser = async () => {
    if (isNewUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [userData, groupMembersData] = await Promise.all([getUser(id), getUserGroupMembers(id)]);
      setUser(userData);
      const initial = {
        name: userData.name || "",
        email: userData.email || "",
        leden_app_admin: !!userData.leden_app_admin,
        leden_app_volunteer_admin: !!userData.leden_app_volunteer_admin,
        leden_app_banner_admin: !!userData.leden_app_banner_admin,
        is_board_member: !!userData.is_board_member,
        is_session_admin: !!userData.is_session_admin,
        is_music_recordings_admin: !!userData.is_music_recordings_admin,
        is_director: !!userData.is_director,
        can_send_messages: !!userData.can_send_messages,
        is_finance_admin: !!userData.is_finance_admin,
      };
      setFormData(initial);
      setOriginalFormData(initial);
      setGroupMembers(groupMembersData);
    } catch (e) {
      console.error("Error fetching user:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, [id, isNewUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFormModified = () => {
    if (isNewUser) return formData.name.trim() !== "" && formData.email.trim() !== "";
    return Object.keys(formData).some((key) => formData[key] !== originalFormData[key]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const roleFields = ROLES.reduce((acc, { field }) => ({ ...acc, [field]: formData[field] }), {});
      let userId;

      if (isNewUser) {
        const newUser = await createUser({
          name: formData.name,
          email: formData.email,
          password: "defaultPassword",
          passwordConfirm: "defaultPassword",
          ...roleFields,
        });
        userId = newUser.id;
      } else {
        await updateUser(id, { name: formData.name, email: formData.email, ...roleFields });
        userId = id;
      }

      if (!isNewUser && userId === pb.authStore.record?.id) {
        try {
          await pb.collection("users").authRefresh();
        } catch (e) {
          // ignore refresh errors
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      navigate(isNewUser ? `/users/${userId}/edit?${searchParams.toString()}` : `/users/${userId}?${searchParams.toString()}`);
    } catch (e) {
      console.error("Error saving user:", e);
      alert("Fout bij opslaan gebruiker: " + (e.message || e));
    }
    setSaving(false);
  };

  const handleAddGroupMember = async () => {
    if (isNewUser) {
      alert("Sla eerst de gebruiker op voordat je groeplidmaatschappen toevoegt.");
      return;
    }
    if (!newGroup || !newSection) {
      alert("Selecteer zowel een groep als een sectie voordat je toevoegt.");
      return;
    }
    try {
      await createUserGroupMember(id, newGroup, newSection);
      setNewGroup("");
      setNewSection("");
      const groupMembersData = await getUserGroupMembers(id);
      setGroupMembers(groupMembersData);
    } catch (err) {
      console.error("Error creating group_member:", err);
      alert("Fout bij toevoegen groeplid: " + (err.message || err));
    }
  };

  const handleDeleteGroupMember = async (membershipId) => {
    if (!window.confirm("Weet je zeker dat je dit lidmaatschap wilt verwijderen?")) return;
    try {
      await deleteUserGroupMember(membershipId);
      const groupMembersData = await getUserGroupMembers(id);
      setGroupMembers(groupMembersData);
    } catch (err) {
      console.error("Error deleting group_member:", err);
      alert("Fout bij verwijderen groeplid: " + (err.message || err));
    }
  };

  const handleBackNavigation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    navigate(isNewUser ? `/users?${searchParams.toString()}` : `/users/${id}?${searchParams.toString()}`);
  }, [queryClient, navigate, isNewUser, id, searchParams]);

  if (loading) return <CenteredSpinner />;
  if (!isNewUser && !user) return <CenteredAlert text="Gebruiker niet gevonden." />;

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });
  const setCheck = (field) => (e) => setFormData({ ...formData, [field]: e.target.checked });

  return (
    <PageContent fullWidth>
      <PageHeader title={isNewUser ? "Nieuwe gebruiker" : "Gebruiker bewerken"} variant="edit">
        <CloseButton onClick={handleBackNavigation} size="normal" ariaLabel="Annuleren" />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Gebruikersgegevens">
          <DetailBlock>
            <Row>
              <Label htmlFor="name">Naam</Label>
              <Input id="name" name="name" placeholder="Naam van de gebruiker" value={formData.name} onChange={set("name")} />
            </Row>
            <Row>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="E-mailadres van de gebruiker" value={formData.email} onChange={set("email")} />
            </Row>
          </DetailBlock>
        </DetailCard>

        <DetailCard title="Rollen">
          <DetailBlock>
            {ROLES.map(({ field, label }) => (
              <Row key={field}>
                <Label htmlFor={field}>{label}</Label>
                <Checkbox id={field} checked={formData[field]} onChange={setCheck(field)} />
              </Row>
            ))}
          </DetailBlock>
        </DetailCard>

        <div className="flex gap-3">
          <Button type="button" onClick={handleBackNavigation} color="gray" text="Annuleren" className="justify-center" />
          <Button
            type="submit"
            disabled={saving || !isFormModified()}
            color="blue"
            text={saving ? "Opslaan..." : "Opslaan"}
            className="justify-center"
          />
        </div>
      </form>

      {!isNewUser && (
        <DetailCard title="Groeplidmaatschappen" className="mt-6">
          <div className="flex-1">
            {groupMembers.length > 0 && (
              <table className="min-w-full mb-4">
                <thead>
                  <tr className="border-b border-[var(--glass-border)]">
                    <th className="pb-2 text-left font-medium text-[var(--text-secondary)]">Groep</th>
                    <th className="pb-2 text-left font-medium text-[var(--text-secondary)]">Sectie</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {groupMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="py-2 text-[var(--text-primary)]">{member.expand?.group?.name || "-"}</td>
                      <td className="py-2 text-[var(--text-primary)]">{member.expand?.section?.name || "-"}</td>
                      <td className="py-2 w-8">
                        <button
                          type="button"
                          onClick={() => handleDeleteGroupMember(member.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                          aria-label="Verwijder lidmaatschap"
                        >
                          <DeleteIcon className="w-4 h-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="pt-4 border-t border-[var(--glass-border)]">
              <p className="font-medium text-[var(--text-secondary)] mb-2">Nieuw lidmaatschap toevoegen</p>
              <div className="flex gap-4 mb-3">
                <GroupDropdown value={newGroup} onChange={setNewGroup} />
                <SectionDropdown value={newSection} onChange={setNewSection} />
              </div>
              <Button
                type="button"
                onClick={handleAddGroupMember}
                disabled={!newGroup || !newSection}
                color={!newGroup || !newSection ? "gray" : "green"}
                text="Lidmaatschap toevoegen"
                className="justify-center"
              />
            </div>
          </div>
        </DetailCard>
      )}
    </PageContent>
  );
};

export default UserEdit;
