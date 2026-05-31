import { useState, useEffect } from "react";
import pb from "../pb";
import {
  getMarkingsByVideo,
  createMarking,
  updateMarking,
  deleteMarking,
} from "../services/musicMarkingsService";

export function useMarkers(videoId) {
  const [markers, setMarkers] = useState([]);
  const [loadingMarkers, setLoadingMarkers] = useState(true);

  // Load markers from PocketBase when videoId changes
  useEffect(() => {
    const loadMarkers = async () => {
      if (videoId && pb.authStore.isValid) {
        setLoadingMarkers(true);
        try {
          const userId = pb.authStore.record.id;
          const records = await getMarkingsByVideo(videoId, userId);
          setMarkers(records);
        } catch (e) {
          console.error('Failed to load markers:', e);
          setMarkers([]);
        } finally {
          setLoadingMarkers(false);
        }
      }
    };
    loadMarkers();
  }, [videoId]);

  // Separate personal and shared markers
  const personalMarkers = markers.filter(m => !m.shared);
  const sharedMarkers = markers.filter(m => m.shared);

  const addMarker = async (markerData) => {
    try {
      const newMarker = await createMarking(markerData);
      setMarkers([...markers, newMarker]);
      return newMarker;
    } catch (e) {
      console.error('Failed to create marker:', e);
      throw e;
    }
  };

  const updateMarkerById = async (id, data) => {
    try {
      const updatedMarker = await updateMarking(id, data);
      setMarkers(markers.map(marker =>
        marker.id === id ? updatedMarker : marker
      ));
      return updatedMarker;
    } catch (e) {
      console.error('Failed to update marker:', e);
      throw e;
    }
  };

  const deleteMarkerById = async (id) => {
    try {
      await deleteMarking(id);
      setMarkers(markers.filter(marker => marker.id !== id));
    } catch (e) {
      console.error('Failed to delete marker:', e);
      throw e;
    }
  };

  return {
    markers,
    personalMarkers,
    sharedMarkers,
    loadingMarkers,
    addMarker,
    updateMarkerById,
    deleteMarkerById,
  };
}
