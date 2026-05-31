import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import pb from "../../pb";

/**
 * Reusable component to show a visual indicator when an entity has remarks
 * @param {string} entityId - The entity ID to show remarks for
 * @param {string} entityType - The entity type: 'meeting_topic' or 'action_item'
 * @param {string} size - Size variant: 'sm' (small) or 'md' (medium)
 * @param {string} className - Additional CSS classes
 */
const RemarksIndicator = ({ entityId, entityType = 'meeting_topic', size = 'md', className = '' }) => {
  // Map entity types to collection names
  const entityTypeMap = {
    'meeting_topic': 'bs_meeting_topics',
    'action_item': 'bs_notes'
  };

  const collectionName = entityTypeMap[entityType];

  // Use direct query to get just the count - this approach worked perfectly
  const { data: remarksCount, isLoading } = useQuery({
    queryKey: ["entity-remarks-count", collectionName, entityId],
    queryFn: async () => {
      if (!collectionName || !entityId) return 0;

      try {
        // Use getList with perPage: 1 to get just the count via totalItems
        const result = await pb.collection("bs_updates").getList(1, 1, {
          filter: `entity_type = "${collectionName}" && parent = "${entityId}"`,
          requestKey: null // Disable auto-cancellation for this request
        });

        return result.totalItems || 0;
      } catch (error) {
        // If request was cancelled, return 0 instead of throwing
        if (error.isAbort || error.name === 'AbortError' || error.status === 0) {
          return 0;
        }
        throw error;
      }
    },
    enabled: !!(collectionName && entityId),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if it's an abort error
      if (error?.isAbort || error?.name === 'AbortError' || error?.status === 0) {
        return false;
      }
      return failureCount < 2;
    }
  });

  if (isLoading) return null;

  const hasRemarks = remarksCount > 0;

  if (!hasRemarks) return null;

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs'
  };

  const marginClasses = {
    sm: 'ml-1',
    md: 'ml-1'
  };

  return (
    <div
      className={`flex items-center text-blue-600 ${marginClasses[size]} ${className}`}
      title={`${remarksCount} opmerking${remarksCount === 1 ? '' : 'en'}`}
    >
      <ChatBubbleLeftIcon className={sizeClasses[size]} />
      <span className={`ml-1 ${textSizeClasses[size]} font-medium`}>
        {remarksCount}
      </span>
    </div>
  );
};

export default RemarksIndicator;