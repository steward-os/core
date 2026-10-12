# Proposal

## Why

A message can only be addressed to whole groups. To reach part of an orchestra, admins created extra groups (Altsaxen, Trombones, Tuba's, …) whose members duplicate the sections of the main orchestra group. Sending to "the trumpets of the Orkest" should be possible directly, without maintaining shadow groups. At the same time, `mb_messages` is readable and writable by anyone without logging in (`listRule`/`viewRule`/`createRule`/`updateRule`/`deleteRule` are all `''`), which becomes more sensitive once messages target specific sections.

## What Changes

- **BREAKING (schema)**: a message is addressed to **exactly one group**. The multi-relation `mb_messages.groups` is replaced by a required single relation `group`. Existing (test) messages are migrated to their first group; messages without a group are removed.
- Rehearsal-mark notifications move from the frontend to a server hook on sessions, which creates one message per session group (sessions can have several groups).
- New optional multi-relation `sections` (→ `mb_sections`) on `mb_messages`. Empty means everyone in the group.
- Message editor gets a section selector: pills with a search field (reusing `TagSelector`, no "create new"), listing only sections that occur among the chosen group's members, each with its member count. Empty shows "Iedereen". The selector is hidden when the chosen group has no members with a section.
- The editor and the send confirmation show the number of recipients.
- Recipients are: members of the group whose section is among the chosen sections, or all members when no sections are chosen. Members without a section only receive "Iedereen" messages. This rule is applied to push delivery and to the inbox.
- A member's section in a group becomes optional for every group type, including orchestra groups ("(geen)" in the group's member editor).
- A "Secties" page under "Beheer" lets admins add, rename and delete sections inline.
- Interface conventions for choosing values and editing simple lists are written down, and the group picker in the message editor follows them (searchable select instead of a dialog).
- **BREAKING (API)**: `mb_messages` API rules are tightened. Reading requires login and being a member of the message's group, the sender, or a `leden_app_admin`; creating requires `can_send_messages` or `leden_app_admin`; changing and deleting is limited to the sender and `leden_app_admin`. Unauthenticated API clients lose access.
- No changes to existing groups, group types or memberships.

## Capabilities

### New Capabilities
- `messaging/message-targeting`: how a message is addressed (one group, optional sections) and how its recipients are resolved, consistently for push delivery and the inbox.
- `messaging/message-access`: who may read, create, change and delete messages through the API.
- `groups/group-membership`: a member's place in a group, including the now optional section, and the admin page that maintains the list of sections.
- `ui/interface-conventions`: shared interface rules for picking values (searchable select, pill selector), dropdown placement, and inline editing of name-only lists.

### Modified Capabilities
<!-- None: there are no existing specs in openspec/specs/. -->

## Impact

- **Schema** (`pocketbase/pb_migrations`): one migration that adds `mb_messages.group` and `mb_messages.sections`, copies `groups[0]` into `group`, removes messages without a group, drops `groups`, and replaces the `mb_messages` API rules. All existing message data is test data.
- **Hooks**: `pocketbase/pb_hooks/push_messages.pb.js` resolves recipients from `group` + `sections`; a new hook on `mb_sessions` creates rehearsal-mark messages (replacing `utils/pushNotificationHelper.js`).
- **Frontend** (`frontend/src`): `pages/Message/MessageEdit.jsx` (single group, section selector, recipient count), `pages/Message/SendConfirmModal.jsx` (sections + count), `pages/Message/MessageList.jsx` (inbox filter built from the user's memberships), `pages/Message/MessageDetail.jsx` (expand), `utils/messageUtils.js` (`recipientsLabel` with group and sections), `pages/Session/UserSessionDetail.jsx` (no longer creates messages), `pages/Group/GroupDetail.jsx` (section optional), and a section-aware service function for recipient counts.
- **Other clients**: steward tenants run this repo's hooks and migrations, so deploying core deploys the change there. The Android app (`onzemuziek-android`) is updated alongside: same inbox filter, single group, section picker.
- **Clients**: anything calling the `mb_messages` API without auth stops working; the app itself always calls it logged in.
