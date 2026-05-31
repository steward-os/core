import { useNavigate } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import { useDeleteMusicRecording, useMusicRecordings } from "../../hooks/crudResourceHooks";

const HEADER_COLUMNS = [
  {
    label: "Titel",
    width: "50%",
    field: "title",
    sortable: true,
    filter: "title",
    mobilePosition: "title",
  },
  {
    label: "YouTube ID",
    width: "35%",
    field: "youtube_id",
    sortable: true,
    mobilePosition: "info",
  },
];

const MusicRecordingList = () => {
  const navigate = useNavigate();
  const { tagConditions } = useSmartTagFilter();
  const filterOptions = tagConditions.length > 0 ? { filter: tagConditions.join(" && ") } : {};
  const { data: recordings, isLoading, error } = useMusicRecordings(filterOptions);
  const deleteMutation = useDeleteMusicRecording();

  const handleDelete = async (id) => {
    if (!window.confirm("Weet je zeker dat je deze opname wilt verwijderen?")) {
      return false;
    }
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error("Error deleting recording:", error);
      return false;
    }
  };

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={<AddButton onClick={() => navigate("/music-recordings-admin/new")} ariaLabel="Nieuwe opname" />}
      >
        Muziek opnames
      </ListHeading>
      <SmartSearch searchFields={["title"]} placeholder="Zoek op titel..." />

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={recordings || []}
          totalItems={recordings?.length || 0}
          headerColumns={HEADER_COLUMNS}
          emptyMessage="Geen opnames gevonden."
          onClick={(recording) => navigate(`/music-recordings-admin/${recording.id}`)}
          onEdit={(recording) => navigate(`/music-recordings-admin/${recording.id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </ListContainer>
  );
};

export default MusicRecordingList;
