# Tasks

## 1. Schema migration and API rules (core)

- [x] 1.1 Check `cascadeDelete` on `mb_message_reactions.message` and `mb_message_reads.message`; verify by reading the collection definitions and note whether the migration must delete them explicitly
- [x] 1.2 Add a migration in `pocketbase/pb_migrations` (timestamp after `1792000001`) that adds `mb_messages.group` (single, required → `mb_groups`) and `mb_messages.sections` (multi, optional → `mb_sections`), copies `groups[0]` into `group`, deletes messages without a group (plus their reactions/reads if not cascaded), and drops `groups`; verify on a copy of local data that a two-group message ends up with its first group and a group-less message is gone
- [x] 1.3 In the same migration, set the `mb_messages` rules from design.md Decision 6, and write the down-migration (re-add `groups` from `group`, drop `group`/`sections`, restore `''` rules); verify `migrate down` then `migrate up` round-trips
- [x] 1.4 Verify the access scenarios in specs/messaging/message-access with `curl` against a local instance: anonymous list returns no items, non-member view is refused, member/sender/admin view succeeds, create without `can_send_messages` is refused, create with two group ids is refused, changing someone else's message is refused

## 2. Server hooks (core)

- [x] 2.1 Update `pb_hooks/push_messages.pb.js` to read `group` and `sections` and select members with `group = g && (no sections | section in sections)` (design.md Decision 5); verify with two test users in different sections of one group that only the targeted section's user appears in the "Fetching push subscriptions for N specific users" log line, and that a message without sections reaches both
- [x] 2.2 Add an `mb_sessions` after-update hook that creates one message per session group when `rehearsal_marks` are added or changed (design.md Decision 3); verify on a local session with two groups that saving new marks creates two messages, saving unchanged marks or clearing them creates none, and a user without `can_send_messages` (but allowed to edit marks) triggers them
- [x] 2.3 Remove `utils/pushNotificationHelper.js` and its call in `pages/Session/UserSessionDetail.jsx`; verify saving rehearsal marks in the app still produces the messages from 2.2 and `npm run lint` reports no unused imports

## 3. Section data, filters and labels (core frontend)

- [x] 3.1 Add a service function (e.g. `getGroupMembersWithSections(groupId)`) returning the group's memberships with `expand: "section"`, and a hook wrapping it; verify it returns the expected rows for a local group
- [x] 3.2 Add pure helpers in `utils/messageUtils.js`: `sectionOptions(memberships)` → `[{ id, name: "Trompet (6)" }]` sorted by name, and `countRecipients(memberships, sectionIds)`; verify with unit tests in `utils/__tests__/messageUtils.test.js` covering no sections, chosen sections and members without a section
- [x] 3.3 Add `buildInboxFilter(memberships)` in `utils/messageUtils.js` implementing design.md Decision 4 with `pb.filter` placeholders; verify with unit tests for a membership with section, without section, several memberships, and none
- [x] 3.4 Rewrite `recipientsLabel(message)` for `expand.group` + `expand.sections` ("Orkest · Trompet, Bugel 1"; "Orkest" without sections) and drop the "Alle gebruikers" fallback; verify by updating the existing tests in `messageUtils.test.js`

## 4. Message editor (core frontend)

- [x] 4.1 Change the group picker in `pages/Message/MessageEdit.jsx` to a single choice stored in `group`, keep the "Kies een groep" validation; verify a new message is stored with `group` set and an existing message loads its group when edited
- [x] 4.2 Add the section selector using `TagSelector` (no `type`, no `onCreateNew`, placeholder "Iedereen"), fed by 3.1/3.2, hidden when no member of the group has a section, cleared on group change, saved as `sections`; verify with "Orkest" (counts shown, search works, labels removable) and "Bestuur" (no selector)
- [x] 4.3 Show the live recipient count under the selector and pass group name, section names and count to `SendConfirmModal.jsx`; verify the count changes from the group total to the section total when a section is added, and the confirmation names group, sections and count

## 5. Inbox and message display (core frontend)

- [x] 5.1 In `pages/Message/MessageList.jsx`, load the current user's memberships and use `buildInboxFilter` for the received tab (skip the query when there are none); expand `group,sections`; verify with two users in different sections that each sees only messages to their section plus "Iedereen" messages
- [x] 5.2 Expand `group,sections` in `pages/Message/MessageDetail.jsx` so the recipients label shows both; verify on a section-targeted message
- [x] 5.3 Search the frontend for remaining uses of `mb_messages` `groups` (`grep -rn "groups" src/pages/Message src/utils/messageUtils.js`); verify none are left, then run `npm run lint` and `npm run test:run` and verify both pass

## 6. Group membership (core frontend)

- [x] 6.1 In `pages/Group/GroupDetail.jsx`, make the section optional for all group types (remove the required-section check, allow "(geen)" in `SectionDropdown`, pass `null` when none); verify a member can be added to an orchestra group with and without a section
- [x] 6.2 Verify "Bestuur"-type groups still show and behave as before (no section column, members addable)

## 7. Integration check (core)

- [ ] 7.1 End-to-end on a local instance: send a message to "Orkest" with section "Trompet" and confirm push arrives only for the trompet test user, the inbox shows it only to them, the API serves it by id to another Orkest member, and an anonymous `curl` gets nothing
- [x] 7.2 Update `CLAUDE.md` (push notifications / messaging notes) to describe one group + optional sections, the rehearsal-mark hook and the `mb_messages` access rules; verify the text matches the implemented behavior

## 8. Other clients

- [x] 8.1 Port to steward: not needed — steward has no frontend or hooks of its own; tenants run core's `pb_hooks` and `pb_migrations` (`PB_HOOKS_DIR`/`PB_MIGRATIONS_DIR`), so deploying core deploys this change
- [x] 8.2 Update the Android app (`onzemuziek-android`): `group` + `sections` in the record, cache (DB version 8) and draft; inbox filter built from the user's memberships; single searchable group picker, section chips with search and counts, recipient count and send-dialog text; Secties menu entry; verify `./gradlew :app:testDebugUnitTest` passes

## 9. Section management and interface conventions (core frontend)

- [x] 9.1 Add the "Secties" page under "Beheer" (`pages/Section/SectionList.jsx`, `services/sectionService.js`, hooks in `crudResourceHooks.js`, route and menu entry) with inline add, rename and delete; verify lint passes and the page is only in the admin menu
- [x] 9.2 Replace the group dialog in `MessageEdit.jsx` with `SearchableSelect`; verify lint passes and picking a group still clears the chosen sections
- [x] 9.3 Render the `SearchableSelect` dropdown in a portal so it opens at its field inside panels with a backdrop filter; verify the dropdown aligns with the field in the message editor

## Workflow follow-up

- Deploy migration, hooks and frontend together per tenant.
- Archive the change with `/opsx:archive` after review and deployment.
