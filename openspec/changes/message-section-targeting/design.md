# Design

## Context

See proposal.md for motivation. Relevant current state in `core`:

- `mb_messages.groups` is a multi-relation to `mb_groups`. `MessageEdit.jsx` lets the sender pick several groups through a chip list and a checkbox dialog.
- A member's section lives on the membership: `mb_group_members { user, group, section, default_row, default_seat }`. `mb_sections` is a global list; the same person can hold different sections in different groups.
- `mb_groups.type` is `orchestra` or `message`; `GroupDetail.jsx` uses it only to require a section for orchestra groups.
- Recipients are resolved twice, independently:
  - `pb_hooks/push_messages.pb.js`: group ids → `mb_group_members` → user ids → `push_subscriptions` → push service.
  - `MessageList.jsx` (received tab): `groups.mb_group_members_via_group.user ?= me || groups:length = 0`.
- Messages are also created automatically: `utils/pushNotificationHelper.js` (called from `UserSessionDetail.jsx` when a conductor or admin saves rehearsal marks) creates a message with all of the session's groups. Orkest and Drumband share most sessions.
- All `mb_messages` API rules are `''` (open to everyone). The app gates sending in the UI with `users.can_send_messages || users.leden_app_admin`.
- All existing message data (15 messages in `servatius`, one with two groups) is test data. All 119 orchestra members have a section; "Bestuur" (type `message`) has none.

## Goals / Non-Goals

**Goals:**
- One recipient rule (see specs/messaging/message-targeting) applied identically in push delivery and the inbox.
- A schema that matches the model: one group per message, no legacy multi-group code paths left behind.
- Reuse existing UI components rather than adding new ones.

**Non-Goals:**
- Section targeting for sessions/rehearsals (`mb_sessions.groups`), even though the instrument groups suggest it. Same pattern, separate change.
- Removing or cleaning up the group `type` field or the instrument groups.
- Tightening API rules on collections other than `mb_messages` (most are open; worth its own change).
- Enforcing the section filter in the API (see Decision 6).

## Decisions

### 1. Replace `groups` with a required single relation `group`
One migration adds `group` (relation → `mb_groups`, `maxSelect: 1`, required), fills it with the first id of `groups`, deletes messages that have no group, and drops `groups`. Reactions and read markers of deleted messages are removed through their existing cascade (verify `cascadeDelete` on `mb_message_reactions.message` and `mb_message_reads.message`; delete them explicitly in the migration if not).
- *Alternative:* keep `groups` and limit the editor to one. Rejected: it leaves a plural field with singular meaning, multi-group branches in every reader, and an API that still accepts several groups. The data is test data, so a clean migration costs nothing.
- The migration works on raw SQL/`app` records, so `required` does not block it.

### 2. `sections` as a multi-relation on `mb_messages`
`sections` → `mb_sections`, `maxSelect` large, not required. Empty = everyone.
- *Alternative:* a per-group target structure (JSON or a join collection). Not needed: with one group per message, the sections unambiguously belong to that group.

### 3. Rehearsal-mark messages created by a server hook
A new `onRecordAfterUpdateSuccess` hook on `mb_sessions` compares the original and new `rehearsal_marks`. When marks are added or changed (not cleared, not unchanged), it creates one `mb_messages` record per session group, without sections, with the existing title/body and `url: /sessions/<id>`. `pushNotificationHelper.js` and its call in `UserSessionDetail.jsx` are removed.
- Running as the app, the hook bypasses the new create rule, so conductors without `can_send_messages` still trigger notifications. It also means the notification no longer depends on which client saved the session.
- Each created message fires the existing push hook, so each group gets its own push. A member in both groups gets two pushes; acceptable, and identical to how two separate messages behave.
- *Alternative:* keep it in the frontend and loop over groups. Rejected: the create rule would block conductors, and it would duplicate the "changed?" logic in every client.

### 4. Inbox filter built from the user's own memberships
Filtering on `group.mb_group_members_via_group.user ?= me && group.mb_group_members_via_group.section ?= sections` is wrong: PocketBase evaluates each `?=` against any joined row, so it would match when *someone* in the group holds the section. Instead the inbox first loads the user's memberships (usually 1–3 rows) and builds one clause per membership:

```
(group = {g1} && (sections:length = 0 || sections.id ?= {s1}))   // membership with section
|| (group = {g2} && sections:length = 0)                      // membership without section
```

Each clause compares the message to one known `(group, section)` pair, so there is no cross-row matching. Note `sections.id ?=`: on a multi-relation, a plain `sections ?= {id}` matches nothing in PocketBase 0.40 (verified against a local instance). A user without memberships gets an empty inbox (the query is skipped). Values go through `pb.filter` placeholders.
- *Alternative:* store resolved recipient ids on the message at send time (`userIds` exists and is unused). Rejected for now: new members would not see earlier messages, and it duplicates membership data.

### 5. Push hook applies the same rule in JS
In `push_messages.pb.js`, the member query becomes `group = {g} && (no sections → true | section = s1 || …)`. Members without a section never match a non-empty section list, which gives the "only Iedereen" behaviour without extra code. Ids come from validated relations; use `{:param}` placeholders with `findRecordsByFilter` where possible.

### 6. API rules: group membership, not sections
- list/view: `@request.auth.id != "" && (sender = @request.auth.id || @request.auth.leden_app_admin = true || group.mb_group_members_via_group.user ?= @request.auth.id)`
- create: `@request.auth.id != "" && (@request.auth.can_send_messages = true || @request.auth.leden_app_admin = true)`
- update/delete: `@request.auth.id != "" && (sender = @request.auth.id || @request.auth.leden_app_admin = true)`

"Exactly one group" is enforced by the field itself (single, required). The view rule has a single `?=` condition, so the cross-row problem from Decision 4 does not apply. Expressing the section filter in a rule would bring that problem back, so section messages are readable by every member of the group through the API (see specs/messaging/message-access).
- Superusers (PocketBase dashboard) and hooks bypass rules; their messages have no sender.
- The existing `onRecordCreateRequest` hook that sets `sender` still runs after the rule check.

### 7. Section selector: `TagSelector` fed with group sections
`components/Form/TagSelector.jsx` already provides removable pills, a search field and a dropdown, controlled through `availableTags`, `selectedTagIds` and `onTagsChange`. Used without `type` and without `onCreateNew`, it acts as a plain multi-select. Options come from one query: the chosen group's memberships with `expand: "section"`, grouped client-side into `{ id, name: "Trompet (6)" }`. The same data gives the recipient count. Both are exposed through a service function (e.g. `getGroupMembersWithSections(groupId)`) plus a small hook, following the services/hooks split in CLAUDE.md. The placeholder reads "Iedereen" when nothing is selected.
- The group picker becomes a single choice; changing the group clears the sections.

### 8. Group membership: section optional everywhere
`GroupDetail.jsx` drops the "section required for non-message groups" check and offers "(geen)" in `SectionDropdown`. The `type` field and its column stay untouched.

## Risks / Trade-offs

- [Members can read section messages of their group through the API] → accepted, documented in specs/messaging/message-access; the UI never shows them.
- [Two implementations of the recipient rule can drift] → both are covered by the same spec scenarios; unit tests for the inbox filter builder, and a local push check for the hook.
- [Schema change breaks clients that read `groups`] → this frontend, its hooks and the Android app are the only clients; all are updated in this change. Older Android versions fail to refresh messages once the migration runs, so the app release goes out with the server change.
- [Old frontend still cached in a PWA sends `groups`] → the create fails with a validation error until the PWA updates; the existing auto-update handles this within a reload.
- [A member in two groups of one session gets two rehearsal-mark messages and pushes] → accepted. In `servatius`, 26 of 163 sessions have two groups and 6 people are in both Orkest and Drumband. If it becomes a nuisance, the hook can skip groups whose members are already reached through another group of the session, without affecting the rest of the design.

## Migration Plan

1. One migration in `pocketbase/pb_migrations` (timestamp after `1792000001`): add `group` and `sections`, copy `groups[0]` → `group`, delete messages without a group, drop `groups`, replace the five `mb_messages` rules. Down-migration re-adds `groups` (filled from `group`), drops `group` and `sections`, restores `''` rules.
2. Deploy migration, hooks and frontend together.
3. Steward tenants pick up the migration and hooks from this repo; release the updated Android app at the same time.
4. Rollback: run the down-migration and redeploy the previous frontend and hooks. Deleted group-less messages and chosen sections are not restored (test data).
