# Spec Delta

## Purpose

Defines who may read, create, change and delete messages through the API, so that messages are only available to logged-in people who are allowed to see or manage them.

## ADDED Requirements

### Requirement: Reading messages requires login
The API SHALL refuse to list or show messages to requests that are not logged in.

#### Scenario: Anonymous list
- **WHEN** an unauthenticated client lists messages
- **THEN** no messages are returned

#### Scenario: Anonymous view
- **WHEN** an unauthenticated client requests a message by id
- **THEN** the request is refused

### Requirement: Who may read a message
A logged-in user SHALL be able to read a message when they are a member of its group, when they sent it, or when they are an app admin.

#### Scenario: Group member
- **WHEN** a member of "Orkest" requests a message addressed to "Orkest"
- **THEN** the message is returned

#### Scenario: Not a member
- **WHEN** a user who is not in "Drumband" requests a message addressed to "Drumband" that they did not send
- **THEN** the request is refused

#### Scenario: Sender
- **WHEN** the sender requests their own message to a group they are not a member of
- **THEN** the message is returned

#### Scenario: App admin
- **WHEN** an app admin requests any message
- **THEN** the message is returned

### Requirement: Section filtering is not an access boundary
The API SHALL allow any member of a message's group to read it, even when the message targets sections they are not in; only the inbox and push delivery apply the section filter.

#### Scenario: Member outside the targeted section
- **WHEN** a "Tuba" member of "Orkest" requests a message to "Orkest" targeted at "Trompet" by id
- **THEN** the message is returned

### Requirement: Who may create, change and delete messages
Only logged-in users allowed to send messages, or app admins, SHALL be able to create messages, each addressed to exactly one group. Changing or deleting a message SHALL be limited to its sender and app admins.

#### Scenario: Member without send permission
- **WHEN** a logged-in user without send permission tries to create a message
- **THEN** the request is refused

#### Scenario: Sender with permission
- **WHEN** a user with send permission creates a message
- **THEN** the message is created with them as sender

#### Scenario: More than one group
- **WHEN** a user with send permission tries to create a message addressed to two groups
- **THEN** the request is refused

#### Scenario: Changing someone else's message
- **WHEN** a user with send permission tries to change or delete a message sent by someone else, and is not an app admin
- **THEN** the request is refused

#### Scenario: Anonymous write
- **WHEN** an unauthenticated client tries to create, change or delete a message
- **THEN** the request is refused
