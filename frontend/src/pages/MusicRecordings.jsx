import { useNavigate } from "react-router-dom";
import { BackButton } from "../components/Button/BackButton";
import CenteredAlert from "../components/CenteredAlert";
import { ListContainer } from "../components/List";
import { ListView } from "../components/List/ListView";
import PageHeader from "../components/Page/PageHeader";
import { useMusicRecordings } from "../hooks/crudResourceHooks";

const HEADER_COLUMNS = [
  {
    label: "Titel",
    width: "100%",
    field: "title",
    sortable: false,
    mobilePosition: "title",
  },
];

const MusicRecordings = () => {
  const navigate = useNavigate();
  const { data: recordings, isLoading, error } = useMusicRecordings({ sort: "title" });

  const handleSelectRecording = (recording) => {
    navigate(`/music-player/${recording.youtube_id}`, {
      state: { title: recording.title, offset: recording.offset || 0 },
    });
  };

  return (
    <>
      <PageHeader
        title="Opnames muziekstukken"
        backButton={<BackButton onClick={() => navigate("/tools")} />}
      />
      <ListContainer fullWidth>
        {isLoading && <CenteredAlert text="Laden..." />}
        {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
        {!isLoading && !error && (
          <ListView
            data={recordings || []}
            totalItems={recordings?.length || 0}
            headerColumns={HEADER_COLUMNS}
            emptyMessage="Geen opnames beschikbaar."
            onClick={handleSelectRecording}
          />
        )}
      </ListContainer>
    </>
  );
};

export default MusicRecordings;
