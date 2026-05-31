# Polymorphic Remarks System - Usage Guide

## Overview
The polymorphic remarks system extends the existing `bs_updates` table to work with any entity, not just ActionItems. This preserves all existing data while adding powerful new functionality.

## Database Schema
The `bs_updates` table now has an additional `entity_type` field:

```sql
-- Existing fields
id              TEXT PRIMARY KEY
update          TEXT              -- The remark/update content
author          TEXT              -- User ID (relation to users)
note            TEXT              -- Entity ID (was ActionItem ID, now any entity)
created         DATETIME
updated         DATETIME

-- New field (added via migration)
entity_type     TEXT              -- Collection name (e.g., "bs_notes", "bs_meeting_topics")
```

## Migration Strategy
1. **Migration adds `entity_type` field** to existing `bs_updates` table
2. **Existing ActionItem updates** continue to work (entity_type is null/empty)
3. **You set entity_type = "bs_notes"** for existing ActionItem records in production
4. **New records** automatically get the correct entity_type

## Service Layer

### Polymorphic Functions (New)
```javascript
import { getRemarksForEntity, createRemark } from "../../services/remarksService";

// Get remarks for any entity
const remarks = await getRemarksForEntity("bs_meeting_topics", topicId);
const remarks = await getRemarksForEntity("bs_projects", projectId);

// Create remark for any entity
await createRemark({
  entity_type: "bs_meeting_topics",
  entity_id: topicId,
  content: "This is a remark",
  author: userId
});
```

### Backward Compatibility (Existing code unchanged)
```javascript
import { getUpdatesForActionItem, createUpdate } from "../../services/remarksService";

// Existing ActionItem code works exactly the same
const updates = await getUpdatesForActionItem(actionItemId);
await createUpdate({ note: actionItemId, update: "Update text", author: userId });
```

## Component Usage

### Full Featured Remarks (Create/Edit/Delete)
```jsx
import RemarksSection from "../../components/Remarks/RemarksSection";

// Add to any detail page - replaces 200+ lines of code with 6 lines!
<RemarksSection
  entityType="bs_meeting_topics"
  entityId={topicId}
  placeholder="Type a remark about this topic..."
/>

// For ActionItems (existing functionality)
<RemarksSection
  entityType="bs_notes"
  entityId={actionItemId}
  title="Updates"
  placeholder="Type an update..."
/>

// For Projects (new!)
<RemarksSection
  entityType="bs_projects"
  entityId={projectId}
  placeholder="Add project notes..."
/>
```

### Read-Only Remarks (For Dialogs)
```jsx
import RemarksDisplay from "../../components/Remarks/RemarksDisplay";

// Simple read-only list
<RemarksDisplay
  entityType="bs_meeting_topics"
  entityId={topic.id}
  compact={true}
/>
```

## React Query Hooks

### Polymorphic Hooks (New)
```javascript
import { useRemarksForEntity, useCreateRemark } from "../../hooks/useRemarksQuery";

// Universal hook for any entity
const { data: remarks } = useRemarksForEntity("bs_meeting_topics", topicId);
const createRemarkMutation = useCreateRemark();
```

### Convenience Hooks
```javascript
import {
  useActionItemRemarks,
  useMeetingTopicRemarks,
  useProjectRemarks
} from "../../hooks/useRemarksQuery";

const { data: actionItemRemarks } = useActionItemRemarks(actionItemId);
const { data: topicRemarks } = useMeetingTopicRemarks(topicId);
const { data: projectRemarks } = useProjectRemarks(projectId);
```

## Field Mapping
The service handles field mapping automatically:

| API Field     | Database Field | Description |
|---------------|----------------|-------------|
| `content`     | `update`       | The remark text |
| `entity_id`   | `note`         | The entity ID |
| `entity_type` | `entity_type`  | Collection name |

## Benefits

### Before (Multiple Tables)
- ❌ `bs_updates` table for ActionItems only
- ❌ `bs_meeting_topic_remarks` table for MeetingTopics
- ❌ Separate services, hooks, components for each
- ❌ 200+ lines of duplicate code per entity

### After (Polymorphic)
- ✅ Single `bs_updates` table for all entities
- ✅ One service, one hook, one component set
- ✅ **6 lines of code** to add remarks to any entity
- ✅ All existing data preserved
- ✅ Backward compatible

## Adding Remarks to New Entities

Adding remarks to a new entity type is now trivial:

```jsx
// Relations
<RemarksSection entityType="leden_relations" entityId={relationId} />

// Volunteering
<RemarksSection entityType="leden_volunteering" entityId={volunteeringId} />

// Sessions
<RemarksSection entityType="leden_sessions" entityId={sessionId} />

// Any future entity
<RemarksSection entityType="your_new_collection" entityId={entityId} />
```

## Production Migration Steps

1. **Run the migration** to add `entity_type` field
2. **Update existing ActionItem records**:
   ```sql
   UPDATE bs_updates SET entity_type = 'bs_notes' WHERE entity_type IS NULL;
   ```
3. **Deploy the new code** (backward compatible)
4. **Start using polymorphic components** for new entities

The system is designed to be completely backward compatible while providing powerful new capabilities.