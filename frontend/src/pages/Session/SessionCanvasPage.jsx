import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import SessionCanvas from "../../features/sessions/SessionCanvas";
import { getSessionWithAttendance, saveCanvasLayout } from "../../services/sessionService";

const SessionCanvasPage = ({ isSessionAdmin = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { sessionData, attendanceData } = await getSessionWithAttendance(id);
        setSession(sessionData);
        setAttendance(attendanceData);
      } catch (e) {
        console.error("Error fetching session:", e);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <CenteredSpinner />;
  if (!session) return <CenteredAlert text="Sessie niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={`Opstelling — ${session.name}`}
        backButton={
          <BackButton
            onClick={() => navigate(`/sessions/${id}?${searchParams.toString()}`)}
            ariaLabel="Terug naar sessie"
          />
        }
      />
      <SessionCanvas
        attendance={attendance}
        canvasLayout={session.canvas_layout ?? {}}
        isSessionAdmin={isSessionAdmin}
        onLayoutChange={async (layout) => {
          await saveCanvasLayout(id, layout);
          setSession((prev) => ({ ...prev, canvas_layout: layout }));
        }}
      />
    </PageContent>
  );
};

export default SessionCanvasPage;
