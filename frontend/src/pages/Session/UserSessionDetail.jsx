import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import posthog from "../../posthog";
import { BackButton } from "../../components/Button/BackButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import { ListView } from "../../components/List/ListView";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import AttendanceByInstrumentGroup from "../../features/sessions/AttendanceByInstrumentGroup";
import AttendanceByRow from "../../features/sessions/AttendanceByRow";
import CanvasViewModal from "../../features/sessions/CanvasViewModal";
import { stateLabels } from "../../features/sessions/stateVars";
import pb from "../../pb";
import { getStateColorClass } from "../../utils/attendanceUtils";
import { notifyRehearsalMarksChanged } from "../../utils/pushNotificationHelper";

const UserSessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [allAttendance, setAllAttendance] = useState([]);
  const [isEditingRehearsalMarks, setIsEditingRehearsalMarks] = useState(false);
  const [rehearsalMarksText, setRehearsalMarksText] = useState("");
  const [showCanvas, setShowCanvas] = useState(false);

  const sectionId = attendance?.expand?.group_member?.expand?.section?.id;
  const isDirector = !!pb.authStore.record?.is_director;
  const isAdmin = !!pb.authStore.record?.leden_app_admin;
  const isSessionAdmin = !!pb.authStore.record?.is_session_admin;

  // Filter section attendance from all attendance
  const sectionAttendance = allAttendance.filter(
    (record) => record.expand?.group_member?.expand?.section?.id === sectionId,
  );

  const fetchAttendance = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await pb.collection("mb_attendance").getOne(id, {
        expand: "session,session.groups,group_member,group_member.user,group_member.section",
      });
      setAttendance(data);
      setError(null);

      // Fetch all attendance for this session
      if (data?.expand?.session?.id) {
        const allData = await pb.collection("mb_attendance").getFullList({
          filter: `session="${data.expand.session.id}"`,
          expand: "group_member,group_member.user,group_member.section",
          sort: "group_member.user.name",
        });
        setAllAttendance(allData);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Kan sessiegegevens niet laden");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleAttendanceUpdate = async (state) => {
    if (!attendance) return;
    setUpdating(true);
    try {
      await pb.collection("mb_attendance").update(attendance.id, { state });
      posthog.capture("attendance updated", {
        attendance_state: state,
        session_id: attendance.expand?.session?.id,
        session_name: attendance.expand?.session?.name,
        session_type: attendance.expand?.session?.type,
      });
      setAttendance({ ...attendance, state });
      // Refetch all attendance to update the section and summary views
      await fetchAttendance();
    } catch {
      console.error("Bijwerken mislukt");
    }
    setUpdating(false);
  };

  const handleRehearsalMarksEdit = () => {
    setRehearsalMarksText(attendance?.expand?.session?.rehearsal_marks || "");
    setIsEditingRehearsalMarks(true);
  };

  const handleRehearsalMarksSave = async () => {
    if (!attendance?.expand?.session?.id) return;
    setUpdating(true);
    try {
      const oldRehearsalMarks = attendance.expand.session.rehearsal_marks;
      const sessionId = attendance.expand.session.id;
      const sessionName = attendance.expand.session.name;

      await pb.collection("mb_sessions").update(sessionId, {
        rehearsal_marks: rehearsalMarksText,
      });

      posthog.capture("rehearsal marks saved", {
        session_id: sessionId,
        session_name: sessionName,
        had_previous_marks: !!oldRehearsalMarks,
      });

      // Send push notification if rehearsal marks were added or changed
      await notifyRehearsalMarksChanged(
        sessionId,
        sessionName,
        oldRehearsalMarks,
        rehearsalMarksText,
        attendance.expand.session.groups,
      );

      // Update local state
      setAttendance({
        ...attendance,
        expand: {
          ...attendance.expand,
          session: {
            ...attendance.expand.session,
            rehearsal_marks: rehearsalMarksText,
          },
        },
      });
      setIsEditingRehearsalMarks(false);
    } catch (err) {
      console.error("Fout bij opslaan repetitie aantekeningen:", err);
      alert("Kon repetitie aantekeningen niet opslaan");
    }
    setUpdating(false);
  };

  const handleRehearsalMarksCancel = () => {
    setIsEditingRehearsalMarks(false);
    setRehearsalMarksText("");
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Laden..." backButton={<BackButton onClick={() => navigate("/")} />} />
        <PageContent>
          <CenteredSpinner />
        </PageContent>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Fout" backButton={<BackButton onClick={() => navigate("/")} />} />
        <PageContent>
          <CenteredAlert message={error} />
        </PageContent>
      </>
    );
  }

  if (!attendance) {
    return (
      <>
        <PageHeader title="Niet gevonden" backButton={<BackButton onClick={() => navigate("/")} />} />
        <PageContent>
          <CenteredAlert message="Sessie niet gevonden" />
        </PageContent>
      </>
    );
  }

  return (
    <PageContent>
      <PageHeader
        title={attendance.expand?.session?.name || "Sessie"}
        backButton={<BackButton onClick={() => navigate("/")} />}
      />

      <div className="space-y-6 max-w-4xl mx-auto pb-safe">
        {/* Main Session Info Card */}
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Datum & Tijd
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-medium text-[var(--text-primary)]">
                    {new Date(attendance.expand?.session?.date_time).toLocaleDateString("nl-NL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <span className="text-gray-600">
                    {new Date(attendance.expand?.session?.date_time).toLocaleTimeString("nl-NL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    uur
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Groepen
                </div>
                <div className="text-[var(--text-primary)]">
                  {(attendance.expand?.session?.expand?.groups || []).map((o) => o.name).join(", ") || "-"}
                </div>
              </div>
            </div>

            {attendance.expand?.session?.description && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Omschrijving
                </div>
                <div className="text-[var(--text-secondary)] whitespace-pre-wrap">
                  {attendance.expand?.session?.description}
                </div>
              </div>
            )}
          </div>

          {/* Rehearsal Marks Section */}
          {attendance.expand?.session?.type === "rehearsal" && (
            <div className="pt-4 border-t border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Repetitie aantekeningen
                </div>
                {(isDirector || isAdmin) && !isEditingRehearsalMarks && (
                  <button
                    onClick={handleRehearsalMarksEdit}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    {attendance.expand?.session?.rehearsal_marks ? "Bewerken" : "Toevoegen"}
                  </button>
                )}
              </div>

              {isEditingRehearsalMarks ? (
                <div className="space-y-3 bg-white/50 p-3 rounded-lg border border-white/60">
                  <textarea
                    value={rehearsalMarksText}
                    onChange={(e) => setRehearsalMarksText(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                    placeholder="Voeg repetitie aantekeningen toe..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleRehearsalMarksCancel}
                      disabled={updating}
                      className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-md hover:bg-black/5 dark:hover:bg-white/10 shadow-sm"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleRehearsalMarksSave}
                      disabled={updating}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm disabled:opacity-50"
                    >
                      Opslaan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[var(--text-secondary)] whitespace-pre-wrap bg-white/30 dark:bg-black/20 p-3 rounded-lg border border-white/40 dark:border-white/10 min-h-[3rem]">
                  {attendance.expand?.session?.rehearsal_marks || (
                    <span className="text-gray-400 italic">Geen aantekeningen</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Canvas button */}
        {attendance.expand?.session?.canvas_layout &&
          Object.keys(attendance.expand.session.canvas_layout).length > 0 && (
            <button
              onClick={() => setShowCanvas(true)}
              className="w-full glass-panel rounded-2xl px-6 py-4 flex items-center justify-between hover:bg-white/10 active:scale-[0.99] transition-all"
            >
              <span className="font-semibold text-[var(--text-primary)]">Opstelling</span>
              <span className="text-[var(--text-secondary)] text-lg">→</span>
            </button>
          )}

        {/* Action Card: User Status */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] px-1">Jouw aanwezigheid</h3>
          <div className="glass-panel rounded-2xl p-6 flex items-center justify-center">
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={updating}
                onClick={() => handleAttendanceUpdate("will_be_present")}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm active:scale-95
                    ${
                      attendance?.state === "will_be_present" || attendance?.state === "present"
                        ? "bg-green-500 text-white shadow-green-200"
                        : "bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 border border-[var(--glass-border)]"
                    }
                    ${updating ? "opacity-30 cursor-not-allowed" : ""}
                  `}
              >
                Aanwezig
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleAttendanceUpdate("wont_be_present")}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm active:scale-95
                    ${
                      attendance?.state === "wont_be_present"
                        ? "bg-red-500 text-white shadow-red-200"
                        : "bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 border border-[var(--glass-border)]"
                    }
                    ${updating ? "opacity-30 cursor-not-allowed" : ""}
                  `}
              >
                Afwezig
              </button>
            </div>
          </div>
        </div>

        {/* Section Attendance */}
        {sectionAttendance.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] px-1">Aanwezigheid van jouw sectie</h3>
            <ListView
              data={sectionAttendance}
              totalItems={sectionAttendance.length}
              headerColumns={[
                {
                  label: "Naam",
                  width: "70%",
                  field: "expand.group_member.expand.user.name",
                  render: (record) => record.expand?.group_member?.expand?.user?.name || "-",
                  sortable: false,
                  mobilePosition: "title",
                },
                {
                  label: "Status",
                  width: "30%",
                  field: "state",
                  render: (record) => (
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStateColorClass(
                        record.state,
                      )}`}
                    >
                      {stateLabels[record.state] || record.state}
                    </span>
                  ),
                  sortable: false,
                  mobilePosition: "right",
                },
              ]}
              emptyMessage="Geen aanwezigheid gevonden voor jouw sectie."
            />
          </div>
        )}

        {/* Attendance Summary */}
        {allAttendance.length > 0 && (
          <div className="mt-8 space-y-6">
            <AttendanceByInstrumentGroup attendance={allAttendance} isSessionAdmin={isSessionAdmin} />
            <AttendanceByRow attendance={allAttendance} isSessionAdmin={isSessionAdmin} />
          </div>
        )}

        {/* Canvas modal */}
        {showCanvas && (
          <CanvasViewModal
            canvasLayout={attendance.expand.session.canvas_layout}
            attendance={allAttendance}
            userAttendanceId={attendance.id}
            onClose={() => setShowCanvas(false)}
          />
        )}

        {/* Uploading State Overlay */}
        {updating && (
          <div className="fixed inset-0 bg-white/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="glass-panel p-4 rounded-xl shadow-lg flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span className="font-medium text-[var(--text-primary)]">Bijwerken...</span>
            </div>
          </div>
        )}
      </div>
    </PageContent>
  );
};

export default UserSessionDetail;
