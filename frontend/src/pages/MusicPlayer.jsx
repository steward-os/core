import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../components/Button/BackButton";
import PageHeader from "../components/Page/PageHeader";
import PageContent from "../components/Page/PageContent";
import DialogPanel from "../components/Modal/DialogPanel";
import Label from "../components/Form/Label";
import Input from "../components/Form/Input";
import { Button } from "../components/Button/Button";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  BookmarkIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import pb from "../pb";
import { useMarkers } from "../hooks/useMarkers";
import { useYouTubePlayer } from "../hooks/useYouTubePlayer";

const MusicPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("Laden...");
  const [offset, setOffset] = useState(0);
  const [activeMarkerId, setActiveMarkerId] = useState(null);
  const [editingMarker, setEditingMarker] = useState(null);
  const [editForm, setEditForm] = useState({ label: "", time: 0 });

  // Custom hooks
  const {
    personalMarkers,
    sharedMarkers,
    loadingMarkers,
    addMarker,
    updateMarkerById,
    deleteMarkerById
  } = useMarkers(videoId);

  const {
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    togglePlayPause,
    handleStop,
    handlePositionChange,
    seekToTime,
    skipBackward,
    skipForward,
  } = useYouTubePlayer(videoId, offset);

  // Get recording info from URL state or use default
  useEffect(() => {
    const state = window.history.state?.usr;
    if (state?.title) {
      setTitle(state.title);
    }
    if (state?.offset !== undefined) {
      setOffset(state.offset);
    }
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddMarker = async () => {
    if (!pb.authStore.isValid) return;

    try {
      const userId = pb.authStore.record.id;
      await addMarker({
        videoId,
        user: userId,
        time: currentTime,
        label: formatTime(currentTime)
      });
    } catch (e) {
      console.error('Failed to create marker:', e);
    }
  };

  const handleMarkerClick = (marker) => {
    setActiveMarkerId(marker.id);
    seekToTime(marker.time);
  };

  const handleDeleteMarker = async (id) => {
    try {
      await deleteMarkerById(id);
      if (editingMarker?.id === id) {
        setEditingMarker(null);
      }
    } catch (e) {
      console.error('Failed to delete marker:', e);
    }
  };

  const handleEditMarker = (marker) => {
    setEditingMarker(marker);
    setEditForm({
      label: marker.label,
      time: marker.time,
      shared: marker.shared || false
    });
  };

  const handleSaveMarker = async () => {
    if (!editForm.label.trim()) return;

    try {
      await updateMarkerById(editingMarker.id, {
        label: editForm.label,
        time: parseFloat(editForm.time),
        shared: editForm.shared
      });
      setEditingMarker(null);
    } catch (e) {
      console.error('Failed to update marker:', e);
    }
  };


  return (
    <>
      <PageHeader
        title={title}
        backButton={<BackButton onClick={() => navigate("/music-recordings")} />}
      />
      <PageContent>
        {/* YouTube Player (Hidden) */}
        <div id="youtube-player" className="hidden"></div>

        {/* Audio Controls */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Play Controls */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
            <button
              onClick={togglePlayPause}
              className="flex flex-col items-center gap-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors min-w-[70px]"
            >
              {isPlaying ? (
                <>
                  <PauseIcon className="w-6 h-6" />
                  <span className="text-xs">Pauze</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-6 h-6" />
                  <span className="text-xs">Afspelen</span>
                </>
              )}
            </button>
            <button
              onClick={handleStop}
              className="flex flex-col items-center gap-1 px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors min-w-[70px]"
            >
              <StopIcon className="w-6 h-6" />
              <span className="text-xs">Stop</span>
            </button>
            <button
              onClick={handleAddMarker}
              className="flex flex-col items-center gap-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-w-[70px]"
            >
              <BookmarkIcon className="w-6 h-6" />
              <span className="text-xs">Markeer</span>
            </button>
          </div>

          {/* Position Seeker */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handlePositionChange}
                className="flex-1"
                step="0.1"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">{formatTime(duration)}</span>
            </div>
            {/* Skip buttons and loading indicator - only show when playing or buffering */}
            {(isPlaying || isBuffering || currentTime > 0) && (
              <div className="flex items-center justify-center mt-2 gap-4">
                {/* Skip Backward Button */}
                <button
                  onClick={skipBackward}
                  className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="5 seconden terug"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                  </svg>
                  <span className="text-sm">5s</span>
                </button>

                {/* Loading Indicator */}
                {isBuffering && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Laden...</span>
                  </div>
                )}

                {/* Skip Forward Button */}
                <button
                  onClick={skipForward}
                  className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="5 seconden vooruit"
                >
                  <span className="text-sm">5s</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Personal Markers List */}
        {personalMarkers.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Persoonlijke Markeringen</h3>
            <div className="space-y-2">
              {[...personalMarkers].sort((a, b) => a.time - b.time).map((marker) => (
                <div
                  key={marker.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${activeMarkerId === marker.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                      : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}
                >
                  <button
                    onClick={() => handleMarkerClick(marker)}
                    className="flex-1 text-left font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {marker.label}
                  </button>
                  <button
                    onClick={() => handleEditMarker(marker)}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                    title="Bewerk"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Bewerk</span>
                  </button>
                  <button
                    onClick={() => handleDeleteMarker(marker.id)}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Verwijder"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Verwijder</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Markers List */}
        {sharedMarkers.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Gedeelde markeringen</h3>
            <div className="space-y-2">
              {[...sharedMarkers].sort((a, b) => a.time - b.time).map((marker) => (
                <div
                  key={marker.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${activeMarkerId === marker.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                      : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}
                >
                  <button
                    onClick={() => handleMarkerClick(marker)}
                    className="flex-1 text-left font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {marker.label}
                  </button>
                  {pb.authStore.record?.is_music_recordings_admin && (
                    <>
                      <button
                        onClick={() => handleEditMarker(marker)}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Bewerk"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Bewerk</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMarker(marker.id)}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Verwijder"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Verwijder</span>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Marker Modal */}
        <DialogPanel
          open={!!editingMarker}
          title="Markering bewerken"
          onClose={() => setEditingMarker(null)}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="marker-label">Naam</Label>
              <Input
                id="marker-label"
                value={editForm.label}
                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                onFocus={() => {
                  // Clear field if it's just the default timestamp
                  if (editForm.label === formatTime(editForm.time)) {
                    setEditForm({ ...editForm, label: "" });
                  }
                }}
                placeholder="Bijv. Intro, Vers 1, ..."
              />
            </div>
            <div>
              <Label htmlFor="marker-time">Tijdstip</Label>
              <div className="flex gap-2">
                <Input
                  id="marker-time"
                  value={formatTime(editForm.time)}
                  readOnly
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newTime = Math.max(0, editForm.time - 1);
                    const newLabel = editForm.label === formatTime(editForm.time)
                      ? formatTime(newTime)
                      : editForm.label;
                    setEditForm({ ...editForm, time: newTime, label: newLabel });
                  }}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="1 seconde terug"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newTime = Math.min(duration, editForm.time + 1);
                    const newLabel = editForm.label === formatTime(editForm.time)
                      ? formatTime(newTime)
                      : editForm.label;
                    setEditForm({ ...editForm, time: newTime, label: newLabel });
                  }}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="1 seconde vooruit"
                >
                  +
                </button>
              </div>
            </div>
            {pb.authStore.record?.is_music_recordings_admin && (
              <div className="flex items-center">
                <input
                  id="marker-shared"
                  type="checkbox"
                  checked={editForm.shared}
                  onChange={(e) => setEditForm({ ...editForm, shared: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="marker-shared" className="ml-2 mb-0">Gedeeld</Label>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setEditingMarker(null)}
                color="gray"
                text="Annuleren"
                className="w-full md:w-auto md:min-w-[160px] justify-center"
              />
              <Button
                onClick={handleSaveMarker}
                color="blue"
                text="Opslaan"
                className="w-full md:w-auto md:min-w-[160px] justify-center"
              />
            </div>
          </div>
        </DialogPanel>
      </PageContent>
    </>
  );
};

export default MusicPlayer;
