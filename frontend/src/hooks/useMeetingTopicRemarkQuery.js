import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMeetingTopicRemark,
  getRemarksForMeetingTopic,
  updateMeetingTopicRemark,
  deleteMeetingTopicRemark
} from "../services/meetingTopicRemarkService";

export function useRemarksForMeetingTopic(meetingTopicId, options = {}) {
  return useQuery({
    queryKey: ["meetingTopicRemarks", "meetingTopic", meetingTopicId, options],
    queryFn: () => getRemarksForMeetingTopic(meetingTopicId, options),
    enabled: !!meetingTopicId,
  });
}

export function useCreateMeetingTopicRemark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMeetingTopicRemark,
    onSuccess: (newRemark) => {
      // Invalidate queries for this meeting topic's remarks
      queryClient.invalidateQueries({
        queryKey: ["meetingTopicRemarks", "meetingTopic", newRemark.meeting_topic]
      });
    },
  });
}

export function useUpdateMeetingTopicRemark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateMeetingTopicRemark(id, data),
    onSuccess: (updatedRemark) => {
      // Invalidate queries for this meeting topic's remarks
      queryClient.invalidateQueries({
        queryKey: ["meetingTopicRemarks", "meetingTopic", updatedRemark.meeting_topic]
      });
    },
  });
}

export function useDeleteMeetingTopicRemark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMeetingTopicRemark,
    onSuccess: () => {
      // Invalidate all meeting topic remark queries since we don't have the meeting_topic ID after deletion
      queryClient.invalidateQueries({
        queryKey: ["meetingTopicRemarks"]
      });
    },
  });
}