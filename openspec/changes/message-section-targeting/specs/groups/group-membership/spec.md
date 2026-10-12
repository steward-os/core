# Spec Delta

## Purpose

Defines a person's membership of a group, including the section they hold within that group, which is used to target messages at part of a group.

## ADDED Requirements

### Requirement: Section is optional for every group
A member SHALL be addable to any group, whatever its type, with or without a section.

#### Scenario: Orchestra member without section
- **WHEN** an admin adds a person to "Orkest" and chooses no section ("(geen)")
- **THEN** the person becomes a member of "Orkest" without a section

#### Scenario: Orchestra member with section
- **WHEN** an admin adds a person to "Orkest" with section "Trompet"
- **THEN** the person becomes a member of "Orkest" with section "Trompet"

### Requirement: Section choice offers all sections
When adding a member or changing a member's section, every existing section SHALL be offered, regardless of which sections the group already contains.

#### Scenario: New group
- **WHEN** an admin adds the first member to a newly created group
- **THEN** all existing sections can be chosen for that member

### Requirement: Existing memberships unchanged
Existing groups, their types and their memberships SHALL NOT be altered by this change.

#### Scenario: Message group remains
- **WHEN** the change is deployed
- **THEN** "Bestuur" keeps its type and members, and its members still have no section

### Requirement: Admins maintain the list of sections
App admins SHALL be able to add, rename and delete sections from the "Secties" page under "Beheer". Deleting a section SHALL keep the affected members in their groups, without a section.

#### Scenario: Adding a section
- **WHEN** an admin adds the section "Hobo"
- **THEN** "Hobo" can be chosen when adding a member to a group

#### Scenario: Renaming a section
- **WHEN** an admin renames "Bas" to "Basgitaar"
- **THEN** every member who had "Bas" now shows "Basgitaar"

#### Scenario: Deleting a section in use
- **WHEN** an admin deletes a section held by members and confirms
- **THEN** those members stay in their groups without a section

#### Scenario: Non-admin
- **WHEN** a user who is not an app admin opens the app menu
- **THEN** "Secties" is not offered
