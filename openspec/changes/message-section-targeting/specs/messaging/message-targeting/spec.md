# Spec Delta

## Purpose

Defines how a sender addresses a message to one group and optionally to specific sections within it, and how the recipients of a message are determined for both push delivery and the inbox.

## ADDED Requirements

### Requirement: A new message targets exactly one group
When a message is composed, the sender SHALL choose exactly one group as recipient. Sending without a group SHALL be refused.

#### Scenario: One group chosen
- **WHEN** a sender chooses the group "Orkest" and sends the message
- **THEN** the message is stored with "Orkest" as its only group

#### Scenario: No group chosen
- **WHEN** a sender tries to send a message without choosing a group
- **THEN** the message is not sent and the sender is told to choose a group

#### Scenario: Switching group
- **WHEN** a sender has chosen "Orkest" and then chooses "Drumband"
- **THEN** "Drumband" replaces "Orkest" as the recipient group

### Requirement: Sections can narrow the recipients
A message SHALL have zero or more target sections. No sections means everyone in the group.

#### Scenario: No sections chosen
- **WHEN** a message to "Orkest" is sent without sections
- **THEN** every member of "Orkest" is a recipient

#### Scenario: Sections chosen
- **WHEN** a message to "Orkest" is sent with sections "Trompet" and "Bugel 1"
- **THEN** only members of "Orkest" whose section in "Orkest" is "Trompet" or "Bugel 1" are recipients

### Requirement: Section selector offers only sections present in the group
The section selector SHALL list only sections held by at least one member of the chosen group, each with its member count in that group, and SHALL be searchable by name. It SHALL NOT allow creating new sections.

#### Scenario: Sections listed with counts
- **WHEN** a sender chooses "Orkest", where 6 members are "Trompet" and 4 are "Tuba"
- **THEN** the selector offers "Trompet (6)" and "Tuba (4)" and no sections without members in "Orkest"

#### Scenario: Searching sections
- **WHEN** the sender types "bug" in the section selector
- **THEN** only sections whose name contains "bug" (case-insensitive) are offered

#### Scenario: Chosen sections shown as removable labels
- **WHEN** the sender picks "Trompet"
- **THEN** "Trompet" appears as a label that can be removed, and is no longer offered in the list

### Requirement: Section selector default and visibility
With no sections chosen, the selector SHALL read "Iedereen". The selector SHALL be hidden when no member of the chosen group has a section.

#### Scenario: Default
- **WHEN** a sender chooses a group whose members have sections
- **THEN** the section selector is shown with no sections chosen and reads "Iedereen"

#### Scenario: Group without sections
- **WHEN** a sender chooses "Bestuur", where no member has a section
- **THEN** no section selector is shown and the message goes to every member of "Bestuur"

#### Scenario: Group change clears sections
- **WHEN** a sender has chosen sections for "Orkest" and then switches to "Drumband"
- **THEN** the chosen sections are cleared

### Requirement: Recipient count before sending
The editor and the send confirmation SHALL show how many members will receive the message, based on the chosen group and sections.

#### Scenario: Count follows the selection
- **WHEN** a sender chooses "Orkest" (61 members) and then adds the section "Trompet" (6 members)
- **THEN** the shown recipient count changes from 61 to 6

#### Scenario: Confirmation shows target
- **WHEN** the sender confirms sending to "Orkest" with section "Trompet"
- **THEN** the confirmation names the group, the chosen sections and the recipient count

### Requirement: Members without a section
A member of the group without a section SHALL be a recipient only when the message has no sections.

#### Scenario: Message to everyone
- **WHEN** a message to "Orkest" has no sections and a member of "Orkest" has no section
- **THEN** that member is a recipient

#### Scenario: Message to sections
- **WHEN** a message to "Orkest" has the section "Trompet" and a member of "Orkest" has no section
- **THEN** that member is not a recipient

### Requirement: Section is evaluated per group membership
A member's section SHALL be taken from their membership in the message's group, not from memberships in other groups.

#### Scenario: Different section in another group
- **WHEN** a person is "Tuba" in "Jeugd" and "Bas" in "Orkest", and a message to "Orkest" targets "Tuba"
- **THEN** that person is not a recipient

### Requirement: Push delivery follows the recipient rule
Push notifications for a new message SHALL be sent only to the recipients as defined by the message's group and sections.

#### Scenario: Section-targeted push
- **WHEN** a message to "Orkest" with section "Trompet" is created
- **THEN** push notifications go to the devices of the "Trompet" members of "Orkest" only

### Requirement: Inbox follows the recipient rule
A member's received messages SHALL contain exactly the messages they are a recipient of.

#### Scenario: Recipient sees message
- **WHEN** a "Trompet" member of "Orkest" opens their received messages
- **THEN** the message to "Orkest" with section "Trompet" is listed

#### Scenario: Non-recipient does not see message
- **WHEN** a "Tuba" member of "Orkest" opens their received messages
- **THEN** the message to "Orkest" with section "Trompet" is not listed

### Requirement: Existing messages are moved to a single group
Messages that existed before this change SHALL be addressed to the first group they had. Messages without any group SHALL be removed.

#### Scenario: Old message to two groups
- **WHEN** the change is deployed and a message was addressed to "Orkest" and "Drumband"
- **THEN** the message is addressed to "Orkest" only, without sections

#### Scenario: Old message without groups
- **WHEN** the change is deployed and a message had no group
- **THEN** the message no longer exists

### Requirement: Rehearsal-mark notifications per group
When rehearsal marks of a session are added or changed, the system SHALL create one message per group of that session, without sections, linking to the session. This SHALL work for whoever may edit rehearsal marks, regardless of their permission to send messages.

#### Scenario: Session with two groups
- **WHEN** a conductor adds rehearsal marks to a session for "Orkest" and "Drumband"
- **THEN** two messages are created, one to "Orkest" and one to "Drumband", each linking to the session

#### Scenario: Marks unchanged
- **WHEN** a session is saved without a change to its rehearsal marks
- **THEN** no message is created

#### Scenario: Marks cleared
- **WHEN** existing rehearsal marks are removed
- **THEN** no message is created

#### Scenario: Editor without send permission
- **WHEN** a conductor without permission to send messages changes the rehearsal marks
- **THEN** the messages are still created

### Requirement: Recipients shown on the message
Wherever a message's recipients are shown, the label SHALL include the group and, if any, the chosen sections.

#### Scenario: Label with sections
- **WHEN** a message to "Orkest" with sections "Trompet" and "Bugel 1" is shown
- **THEN** its recipients read like "Orkest · Trompet, Bugel 1"

#### Scenario: Label without sections
- **WHEN** a message to "Orkest" without sections is shown
- **THEN** its recipients read "Orkest"
