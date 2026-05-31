import { XMarkIcon as DeleteIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import { Button } from "../../components/Button/Button";
import { DeleteButton } from "../../components/Button/DeleteButton";
import { EditButton } from "../../components/Button/EditButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import FormFieldSelectAjax from "../../components/Form/FormFieldSelectAjax";
import InlineEditableNumber from "../../components/InlineEditableNumber";
import { ListView } from "../../components/List/ListView";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import SectionDropdown from "../../components/SectionDropdown";
import DetailCard from "../../components/Detail/DetailCard";
import DetailBlock, { Row, Label, Value } from "../../components/Detail/DetailBlock";
import { useGroupMembers } from "../../hooks/useGroupDetailQuery";
import pb from "../../pb";
import { GROUP_TYPES } from "../../schemas/groupSchema";
import { createGroupMember, deleteGroup, deleteGroupMember, getGroup } from "../../services/groupService";

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addUserForm, setAddUserForm] = useState({ user: "" });
  const [newSection, setNewSection] = useState("");
  const [newDefaultRow, setNewDefaultRow] = useState("");

  const [memberQuery, setMemberQuery] = useState({ sortField: "created", sortDirection: "desc", filters: {} });

  const { data: groupMembers = [], isLoading: groupMembersLoading } = useGroupMembers(
    id,
    memberQuery.sortField,
    memberQuery.sortDirection,
    memberQuery.filters,
  );

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const groupData = await getGroup(id);
        setGroup(groupData);
      } catch (error) {
        console.error("Error fetching group:", error);
        setGroup(null);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  const handleUpdateDefaultRow = async (groupMemberId, newValue) => {
    try {
      await pb.collection("mb_group_members").update(groupMemberId, { default_row: newValue });
      queryClient.invalidateQueries(["groupMembers", id]);
    } catch (error) {
      console.error("Error updating default_row:", error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze groep wilt verwijderen?")) return;
    try {
      await deleteGroup(id);
      navigate(`/groups?${searchParams.toString()}`);
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Er is een fout opgetreden bij het verwijderen van de groep.");
    }
  };

  const isMessageGroup = group?.type === "message";

  const handleAddMember = async () => {
    if (!addUserForm.user || (!isMessageGroup && !newSection)) {
      alert(
        isMessageGroup
          ? "Selecteer een gebruiker voordat je toevoegt."
          : "Selecteer zowel een gebruiker als een sectie voordat je toevoegt.",
      );
      return;
    }
    try {
      await createGroupMember(id, addUserForm.user, isMessageGroup ? null : newSection, newDefaultRow || null);
      setAddUserForm({ user: "" });
      setNewSection("");
      setNewDefaultRow("");
      queryClient.invalidateQueries(["groupMembers", id]);
    } catch (err) {
      console.error("Error creating group member:", err);
      alert("Fout bij toevoegen lid: " + (err.message || err));
    }
  };

  const handleDeleteMember = async (membershipId) => {
    if (!window.confirm("Weet je zeker dat je dit lid wilt verwijderen uit deze groep?")) return;
    try {
      await deleteGroupMember(membershipId);
      queryClient.invalidateQueries(["groupMembers", id]);
    } catch (err) {
      console.error("Error deleting group member:", err);
      alert("Fout bij verwijderen lid: " + (err.message || err));
    }
  };

  const MEMBER_HEADER_COLUMNS = [
    {
      label: "Naam",
      field: "user",
      width: isMessageGroup ? "60%" : "35%",
      sortable: true,
      filter: "user",
      render: (item) => item.expand?.user?.name || "-",
      mobilePosition: "title",
    },
    ...(!isMessageGroup
      ? [
          {
            label: "Sectie",
            field: "section",
            width: "30%",
            sortable: true,
            filter: "section",
            render: (item) => item.expand?.section?.name || "-",
            mobilePosition: "info",
          },
          {
            label: "Rij",
            field: "default_row",
            width: "15%",
            sortable: true,
            filter: "default_row",
            render: (item) => (
              <InlineEditableNumber
                value={item.default_row}
                onSave={(newValue) => handleUpdateDefaultRow(item.id, newValue)}
                placeholder="-"
                min={1}
              />
            ),
            mobilePosition: "info",
          },
        ]
      : []),
    {
      label: "Toegevoegd",
      field: "created",
      width: isMessageGroup ? "35%" : "15%",
      sortable: true,
      mobilePosition: "info",
    },
    {
      label: "",
      field: "actions",
      width: "5%",
      sortable: false,
      mobilePosition: "right",
      render: (item) => (
        <button
          type="button"
          onClick={() => handleDeleteMember(item.id)}
          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
          aria-label="Verwijder lid"
        >
          <DeleteIcon className="w-4 h-4 text-red-600" />
        </button>
      ),
    },
  ];

  if (loading) return <CenteredSpinner />;
  if (!group) return <CenteredAlert text="Groep niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={group.name}
        backButton={
          <BackButton onClick={() => navigate(`/groups?${searchParams.toString()}`)} ariaLabel="Terug naar groepen" />
        }
      >
        <EditButton
          onClick={() => navigate(`/groups/${id}/edit?${searchParams.toString()}`)}
          size="normal"
          ariaLabel="Groep bewerken"
          showText
        />
        <DeleteButton onClick={handleDelete} size="normal" ariaLabel="Groep verwijderen" showText />
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="Groepsinformatie">
          <DetailBlock>
            <Row>
              <Label>Naam</Label>
              <Value>{group.name}</Value>
            </Row>
            <Row>
              <Label>Type</Label>
              <Value>{GROUP_TYPES.find((t) => t.value === group.type)?.label || group.type || "-"}</Value>
            </Row>
          </DetailBlock>
        </DetailCard>

        {/* Members section with custom header for Add button */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="glass-header px-4 py-3">
            <h3 className="font-semibold text-[var(--text-primary)]">Gebruikers</h3>
          </div>
          <div className="p-4 space-y-4">
            {groupMembersLoading ? (
              <CenteredAlert text="Laden..." />
            ) : (
              <>
                <ListView
                  data={groupMembers || []}
                  totalItems={groupMembers?.length || 0}
                  headerColumns={MEMBER_HEADER_COLUMNS}
                  defaultSortField="created"
                  defaultSortDirection="desc"
                  emptyMessage="Geen leden gevonden."
                  onQueryChange={setMemberQuery}
                />

                <div className="pt-2 border-t border-[var(--glass-border)]">
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Nieuw lid toevoegen</p>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <FormFieldSelectAjax
                      name="user"
                      collection="users"
                      optionDisplay="name"
                      searchFields={["name", "email"]}
                      placeholder="Zoek een gebruiker..."
                      formData={addUserForm}
                      setFormData={setAddUserForm}
                      className="w-64"
                    />
                    {!isMessageGroup && (
                      <div className="w-40">
                        <SectionDropdown value={newSection} onChange={setNewSection} />
                      </div>
                    )}
                    {!isMessageGroup && (
                      <input
                        type="number"
                        min={1}
                        value={newDefaultRow}
                        onChange={(e) => setNewDefaultRow(e.target.value)}
                        placeholder="Rij"
                        className="w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!addUserForm.user || (!isMessageGroup && !newSection)}
                    color={!addUserForm.user || (!isMessageGroup && !newSection) ? "gray" : "green"}
                    text="Lid toevoegen"
                    className=""
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageContent>
  );
};

export default GroupDetail;
