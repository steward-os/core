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
import DetailBlock, { Label, Row, Value } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import GroupDropdown from "../../components/GroupDropdown";
import InlineEditableNumber from "../../components/InlineEditableNumber";
import { ListView } from "../../components/List/ListView";
import { SimplePaginator } from "../../components/List/SimplePaginator";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import SectionDropdown from "../../components/SectionDropdown";
import { stateLabels } from "../../features/sessions/stateVars";
import { useDeleteUser } from "../../hooks/crudResourceHooks";
import { useUserAttendanceHistory, useUserGroupMembers } from "../../hooks/useUserDetailQuery";
import pb from "../../pb";
import { createUserGroupMember, deleteUserGroupMember, getUser, getUserAttendanceStats } from "../../services/userService";
import { getStateColorClass } from "../../utils/attendanceUtils";

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

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const deleteUserMutation = useDeleteUser();
  const [user, setUser] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const [newSection, setNewSection] = useState("");

  const [groupQuery, setGroupQuery] = useState({ sortField: "created", sortDirection: "desc", filters: {} });
  const [attendanceQuery, setAttendanceQuery] = useState({ sortField: "session", sortDirection: "desc", filters: {} });
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePerPage] = useState(25);

  const { data: groupMembers = [], isLoading: groupMembersLoading } = useUserGroupMembers(
    id,
    groupQuery.sortField,
    groupQuery.sortDirection,
    groupQuery.filters,
  );
  const { data: attendanceData, isLoading: attendanceLoading } = useUserAttendanceHistory(
    groupMembers,
    attendanceQuery.sortField,
    attendanceQuery.sortDirection,
    attendanceQuery.filters,
    attendancePage,
    attendancePerPage,
  );

  const handleUpdateDefaultRow = async (groupMemberId, newValue) => {
    try {
      await pb.collection("mb_group_members").update(groupMemberId, { default_row: newValue });
      queryClient.invalidateQueries(["userGroupMembers", id]);
    } catch (error) {
      console.error("Error updating default_row:", error);
      throw error;
    }
  };

  const GROUP_MEMBERSHIPS_COLUMNS = [
    {
      label: "Groep",
      field: "group",
      width: "35%",
      sortable: true,
      filter: "group",
      render: (item) => item.expand?.group?.name || "-",
      mobilePosition: "title",
    },
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
    {
      label: "Toegevoegd",
      field: "created",
      width: "15%",
      sortable: true,
      mobilePosition: "info",
    },
    {
      label: "",
      field: "actions",
      width: "5%",
      sortable: false,
      render: (item) => (
        <button
          type="button"
          onClick={() => handleDeleteGroupMember(item.id)}
          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
          aria-label="Verwijder lidmaatschap"
        >
          <DeleteIcon className="w-4 h-4 text-red-600" />
        </button>
      ),
    },
  ];

  const ATTENDANCE_COLUMNS = [
    {
      label: "Datum",
      field: "session",
      width: "25%",
      sortable: true,
      render: (item) =>
        item.expand?.session?.date_time ? new Date(item.expand.session.date_time).toLocaleDateString("nl-NL") : "-",
      mobilePosition: "info",
    },
    {
      label: "Groep",
      field: "group_member.group",
      width: "30%",
      sortable: false,
      filter: "group_member.group",
      render: (item) => item.expand?.group_member?.expand?.group?.name || "-",
      mobilePosition: "title",
    },
    {
      label: "Sectie",
      field: "group_member.section",
      width: "25%",
      sortable: false,
      filter: "group_member.section",
      render: (item) => item.expand?.group_member?.expand?.section?.name || "-",
      mobilePosition: "info",
    },
    {
      label: "Status",
      field: "state",
      width: "20%",
      sortable: true,
      filter: "state",
      render: (item) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStateColorClass(item.state)}`}>
          {stateLabels[item.state] || item.state}
        </span>
      ),
      mobilePosition: "right",
    },
  ];

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const userData = await getUser(id);
      setUser(userData);
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
    setLoading(false);
  };

  const fetchAttendanceStats = async () => {
    setStatsLoading(true);
    try {
      const statsData = await getUserAttendanceStats(id);
      setAttendanceStats(statsData);
    } catch (e) {
      console.error("Error fetching attendance stats:", e);
      setAttendanceStats(null);
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    fetchUserData();
    fetchAttendanceStats();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?")) return;
    try {
      await deleteUserMutation.mutateAsync(user.id);
      navigate(`/users?${searchParams.toString()}`);
    } catch (error) {
      alert("Er is een fout opgetreden bij het verwijderen van de gebruiker.", error);
    }
  };

  const handleAddGroupMember = async () => {
    if (!newGroup || !newSection) {
      alert("Selecteer zowel een groep als een sectie voordat je toevoegt.");
      return;
    }
    try {
      await createUserGroupMember(id, newGroup, newSection);
      setNewGroup("");
      setNewSection("");
      queryClient.invalidateQueries(["userGroupMembers", id]);
    } catch (err) {
      console.error("Error creating group member:", err);
      alert("Fout bij toevoegen groeplidmaatschap: " + (err.message || err));
    }
  };

  const handleDeleteGroupMember = async (membershipId) => {
    if (!window.confirm("Weet je zeker dat je dit lidmaatschap wilt verwijderen?")) return;
    try {
      await deleteUserGroupMember(membershipId);
      queryClient.invalidateQueries(["userGroupMembers", id]);
    } catch (err) {
      console.error("Error deleting group member:", err);
      alert("Fout bij verwijderen groeplidmaatschap: " + (err.message || err));
    }
  };

  if (loading) return <CenteredSpinner />;
  if (!user) return <CenteredAlert text="Gebruiker niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={user.name}
        backButton={
          <BackButton onClick={() => navigate(`/users?${searchParams.toString()}`)} ariaLabel="Terug naar gebruikers" />
        }
      >
        <EditButton
          onClick={() => navigate(`/users/${id}/edit?${searchParams.toString()}`)}
          showText
          size="normal"
          ariaLabel="Gebruiker bewerken"
        />
        <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Gebruiker verwijderen" />
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="Gebruikersgegevens">
          <DetailBlock>
            <Row><Label>E-mail</Label><Value>{user.email}</Value></Row>
            <Row><Label>Gebruikers-ID</Label><Value>{user.id}</Value></Row>
            {user.created && (
              <Row><Label>Aangemaakt</Label><Value>{new Date(user.created).toLocaleDateString("nl-NL")}</Value></Row>
            )}
          </DetailBlock>
        </DetailCard>

        <DetailCard title="Rollen">
          <DetailBlock>
            {ROLES.map(({ field, label }) => (
              <Row key={field}>
                <Label>{label}</Label>
                <Value>{user[field] ? "Ja" : "Nee"}</Value>
              </Row>
            ))}
          </DetailBlock>
        </DetailCard>

        {!statsLoading && attendanceStats && (
          <DetailCard title="Aanwezigheidsstatistieken">
            <DetailBlock title={`${attendanceStats.yearToDate.year} (tot nu toe)`}>
              <Row><Label>Aanwezig</Label><Value><span className="text-green-600">{attendanceStats.yearToDate.present || 0}</span></Value></Row>
              <Row><Label>Aangemeld</Label><Value><span className="text-blue-600">{attendanceStats.yearToDate.willBePresent || 0}</span></Value></Row>
              <Row><Label>Afwezig (zonder melding)</Label><Value><span className="text-red-600">{attendanceStats.yearToDate.notPresentWithoutNotice || 0}</span></Value></Row>
              <Row><Label>Afwezig (met melding)</Label><Value><span className="text-orange-600">{attendanceStats.yearToDate.notPresentWithNotice || 0}</span></Value></Row>
              <Row><Label>Totaal</Label><Value><span className="font-medium">{attendanceStats.yearToDate.total || 0}</span></Value></Row>
            </DetailBlock>
            <DetailBlock title={`${attendanceStats.lastYear.year} (volledig jaar)`}>
              <Row><Label>Aanwezig</Label><Value><span className="text-green-600">{attendanceStats.lastYear.present || 0}</span></Value></Row>
              <Row><Label>Aangemeld</Label><Value><span className="text-blue-600">{attendanceStats.lastYear.willBePresent || 0}</span></Value></Row>
              <Row><Label>Afwezig (zonder melding)</Label><Value><span className="text-red-600">{attendanceStats.lastYear.notPresentWithoutNotice || 0}</span></Value></Row>
              <Row><Label>Afwezig (met melding)</Label><Value><span className="text-orange-600">{attendanceStats.lastYear.notPresentWithNotice || 0}</span></Value></Row>
              <Row><Label>Totaal</Label><Value><span className="font-medium">{attendanceStats.lastYear.total || 0}</span></Value></Row>
            </DetailBlock>
          </DetailCard>
        )}

        <DetailCard title="Groeplidmaatschappen">
          <div className="flex-1">
            {groupMembersLoading ? (
              <CenteredSpinner />
            ) : (
              <>
                <ListView
                  data={groupMembers}
                  totalItems={groupMembers.length}
                  headerColumns={GROUP_MEMBERSHIPS_COLUMNS}
                  defaultSortField="created"
                  defaultSortDirection="desc"
                  emptyMessage="Geen groeplidmaatschappen gevonden."
                  className="mb-4"
                  onQueryChange={setGroupQuery}
                />
                <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
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
              </>
            )}
          </div>
        </DetailCard>

        {groupMembers.length > 0 && (
          <DetailCard title="Aanwezigheidsgeschiedenis">
            <div className="flex-1">
              {attendanceLoading ? (
                <CenteredSpinner />
              ) : (
                <>
                  <ListView
                    data={attendanceData?.items || []}
                    totalItems={attendanceData?.totalItems || 0}
                    headerColumns={ATTENDANCE_COLUMNS}
                    defaultSortField="session"
                    defaultSortDirection="desc"
                    emptyMessage="Geen aanwezigheidsgeschiedenis gevonden."
                    onQueryChange={setAttendanceQuery}
                  />
                  {attendanceData?.totalItems > attendancePerPage && (
                    <div className="mt-4">
                      <SimplePaginator
                        currentPage={attendancePage}
                        totalPages={Math.ceil(attendanceData.totalItems / attendancePerPage)}
                        totalItems={attendanceData.totalItems}
                        perPage={attendancePerPage}
                        onPreviousPage={() => setAttendancePage((prev) => Math.max(1, prev - 1))}
                        onNextPage={() => setAttendancePage((prev) => prev + 1)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </DetailCard>
        )}
      </div>
    </PageContent>
  );
};

export default UserDetail;
