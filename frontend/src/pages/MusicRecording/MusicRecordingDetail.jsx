import { BackButton } from "../../components/Button/BackButton";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EditButton } from "../../components/Button/EditButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import PageHeader from "../../components/Page/PageHeader";
import PageContent from "../../components/Page/PageContent";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailCard from "../../components/Detail/DetailCard";
import DetailBlock, { Row, Label, Value } from "../../components/Detail/DetailBlock";
import pb from "../../pb";

const MusicRecordingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecording = async () => {
      setLoading(true);
      try {
        const data = await pb.collection("mb_music_recordings").getOne(id);
        setRecording(data);
      } catch (e) {
        console.error("Error fetching recording:", e);
      }
      setLoading(false);
    };
    fetchRecording();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze opname wilt verwijderen?")) return;
    try {
      await pb.collection("mb_music_recordings").delete(recording.id);
      navigate("/music-recordings-admin");
    } catch (error) {
      alert("Er is een fout opgetreden bij het verwijderen van de opname.");
      console.error(error);
    }
  };

  if (loading) return <CenteredSpinner />;
  if (!recording) return <CenteredAlert text="Opname niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={recording.title}
        backButton={<BackButton onClick={() => navigate("/music-recordings-admin")} ariaLabel="Terug naar opnames" />}
      >
        <EditButton
          onClick={() => navigate(`/music-recordings-admin/${id}/edit`)}
          size="normal"
          ariaLabel="Opname bewerken"
          showText
        />
        <DeleteButton onClick={handleDelete} size="normal" ariaLabel="Opname verwijderen" showText />
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="Opname details">
          <DetailBlock>
            <Row>
              <Label>Titel</Label>
              <Value>{recording.title}</Value>
            </Row>
            <Row>
              <Label>YouTube ID</Label>
              <Value><span className="font-mono">{recording.youtube_id}</span></Value>
            </Row>
          </DetailBlock>
        </DetailCard>

        <DetailCard title="Video preview">
          <div className="w-full aspect-video rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${recording.youtube_id}`}
              title={recording.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DetailCard>
      </div>
    </PageContent>
  );
};

export default MusicRecordingDetail;
