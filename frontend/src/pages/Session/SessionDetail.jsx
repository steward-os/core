import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ActionButton, BuildButton, DeleteButton, EditButton } from "../../components/Button";
import { neutralIconButtonClasses } from "../../components/Button/iconButtonClasses";
import { BackButton } from "../../components/Button/BackButton";
import { TableCellsIcon } from "@heroicons/react/24/outline";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import DetailCard from "../../components/Detail/DetailCard";
import DetailBlock, { Row, Label, Value } from "../../components/Detail/DetailBlock";
import AttendanceByInstrumentGroup from "../../features/sessions/AttendanceByInstrumentGroup";
import AttendanceByRow from "../../features/sessions/AttendanceByRow";
import AttendanceCounters from "../../features/sessions/AttendanceCounters";
import AttendanceTable from "../../features/sessions/AttendanceTable";
import { useDeleteSession } from "../../hooks/crudResourceHooks";
import { setAttendanceState, setConfirmState } from "../../services/attendanceService";
import { getSessionWithAttendance } from "../../services/sessionService";
import { formatDateTime } from "../../utils/dateTimeUtils";

const SessionDetail = ({ isSessionAdmin = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deleteSessionMutation = useDeleteSession();
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [updating, setUpdating] = useState(false);

  const fetchSessionAndAttendance = async () => {
    setLoading(true);
    try {
      const { sessionData, attendanceData } = await getSessionWithAttendance(id);
      setSession(sessionData);
      setAttendance(attendanceData);
    } catch (e) {
      console.error("Error fetching session and attendance:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessionAndAttendance();
  }, [id]);

  const handleSetState = async (newState) => {
    await setAttendanceState({
      attendance,
      selectedRowKeys,
      newState,
      fetchSessionAndAttendance,
      setSelectedRowKeys,
      setUpdating,
    });
    // pb.js handles cache invalidation automatically
  };

  const handleConfirmState = async () => {
    await setConfirmState({
      attendance,
      fetchSessionAndAttendance,
      setSelectedRowKeys,
      setUpdating,
    });
    // pb.js handles cache invalidation automatically
  };

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze sessie wilt verwijderen?")) return;
    try {
      await deleteSessionMutation.mutateAsync(session.id);
      navigate(`/sessions?${searchParams.toString()}`);
    } catch (error) {
      alert("Er is een fout opgetreden bij het verwijderen van de sessie.", error);
    }
  };

  const stateCounts = attendance.reduce((acc, record) => {
    acc[record.state] = (acc[record.state] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return <CenteredSpinner />;
  }

  if (!session) {
    return <CenteredAlert text="Sessie niet gevonden." />;
  }

  return (
    <PageContent fullWidth>
      <PageHeader
        title={session.name}
        backButton={
          <BackButton onClick={() => navigate(`/sessions?${searchParams.toString()}`)} ariaLabel="Terug naar sessies" />
        }
      >
        {isSessionAdmin && (
          <>
            {attendance.length > 0 && (
              <button onClick={() => navigate(`/sessions/${id}/canvas?${searchParams.toString()}`)} className={neutralIconButtonClasses(true)} aria-label="Opstelling bewerken">
                <TableCellsIcon className="w-5 h-5 mr-1" />
                Opstelling bewerken
              </button>
            )}
            <EditButton
              onClick={() => navigate(`/sessions/${id}/edit?${searchParams.toString()}`)}
              showText
              size="normal"
              ariaLabel="Sessie bewerken"
            />
            <DeleteButton onClick={handleDelete} size="normal" ariaLabel="Sessie verwijderen" showText />
          </>
        )}
      </PageHeader>

      {/* Content */}
      <div>
        <DetailCard title="Sessiegegevens" className="mb-6">
          <DetailBlock>
            <Row>
              <Label>Datum</Label>
              <Value>{formatDateTime(session.date_time)}</Value>
            </Row>
            <Row>
              <Label>Groepen</Label>
              <Value>{session.expand?.groups?.map((o) => o.name).join(", ") || "-"}</Value>
            </Row>
            {session.type === "rehearsal" && session.rehearsal_marks && (
              <Row>
                <Label>Repetitie aantekeningen</Label>
                <Value>
                  <span className="whitespace-pre-wrap">{session.rehearsal_marks}</span>
                </Value>
              </Row>
            )}
          </DetailBlock>
          {(session.description || (session.type === "rehearsal" && session.rehearsal_marks)) && (
            <DetailBlock>
              {session.description && (
                <Row>
                  <Label>Omschrijving</Label>
                  <Value>{session.description}</Value>
                </Row>
              )}
              {session.type === "rehearsal" && session.rehearsal_marks && (
                <Row>
                  <Label>Aanwezigheid</Label>
                  <Value>
                    <AttendanceCounters stateCounts={stateCounts} />
                  </Value>
                </Row>
              )}
            </DetailBlock>
          )}
        </DetailCard>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceByInstrumentGroup attendance={attendance} isSessionAdmin={isSessionAdmin} />
          {new Date(session.date_time) > new Date(Date.now() - 60 * 60 * 1000) && (
            <AttendanceByRow attendance={attendance} isSessionAdmin={isSessionAdmin} />
          )}
        </div>

        {isSessionAdmin && (
          <div className="mt-8 glass-panel rounded-2xl overflow-hidden">
            <div className="glass-header px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-medium text-[var(--text-primary)]">Aanwezigheid leden</h3>
              <div className="flex gap-2">
                {new Date(session.date_time) > new Date(Date.now() + 120 * 60 * 1000) ? (
                  <>
                    <ActionButton
                      title="Komt"
                      onClick={() => handleSetState("will_be_present")}
                      disabled={selectedRowKeys.length === 0 || updating}
                      bg="bg-green-600"
                    />
                    <ActionButton
                      title="Komt niet"
                      onClick={() => handleSetState("wont_be_present")}
                      disabled={selectedRowKeys.length === 0 || updating}
                      bg="bg-red-600"
                    />
                  </>
                ) : (
                  <>
                    <ActionButton
                      title="Aanwezig"
                      onClick={() => handleSetState("present")}
                      disabled={selectedRowKeys.length === 0 || updating}
                      bg="bg-green-600"
                    />
                    <ActionButton
                      title="Afwezig"
                      onClick={() => handleSetState("not_present")}
                      disabled={selectedRowKeys.length === 0 || updating}
                      bg="bg-red-600"
                    />
                    <ActionButton
                      title="Aan/afmelding Bevestigen"
                      onClick={handleConfirmState}
                      disabled={selectedRowKeys.length === 0 || updating}
                    />
                  </>
                )}
              </div>
            </div>

            <AttendanceTable
              attendance={attendance}
              selectedRowKeys={selectedRowKeys}
              setSelectedRowKeys={setSelectedRowKeys}
            />
          </div>
        )}
      </div>
    </PageContent>
  );
};

export default SessionDetail;
