# Spec Delta

## Purpose

Shared interface conventions for the member app, so that choosing values and maintaining simple lists work the same way on every screen and stay usable on a phone.

## ADDED Requirements

### Requirement: Single choice from a list is a searchable select in place
Choosing one value from a list of records (such as a group) SHALL happen in a searchable select inside the form, not in a separate dialog. Typing SHALL filter the options by name.

#### Scenario: Choosing a group for a message
- **WHEN** a sender clicks the recipient field and types "orke"
- **THEN** a dropdown under the field shows only matching groups, and picking one fills the field without opening a dialog

#### Scenario: Clearing the choice
- **WHEN** the sender clears the chosen group
- **THEN** the field is empty again and shows its placeholder

### Requirement: Multiple choice from a list is a pill selector with search
Choosing several values from a list (such as sections) SHALL use removable labels (pills) plus a search field that offers the remaining options. Creating new values from this selector SHALL NOT be possible unless the screen is meant for it.

#### Scenario: Picking and removing
- **WHEN** a sender picks "Trompet" and then removes it with its ✕
- **THEN** "Trompet" is shown as a label after picking and is offered in the list again after removing

#### Scenario: Nothing picked
- **WHEN** no value is picked
- **THEN** the selector shows a placeholder that states what an empty choice means (for sections: "Iedereen")

### Requirement: Dropdowns open at their field
A dropdown or suggestion list SHALL open directly below (or, near the bottom of the screen, directly above) the field it belongs to, aligned with that field, and above all other content, including when the field sits inside a panel or dialog.

#### Scenario: Field inside a panel
- **WHEN** the group select inside the message editor panel is opened
- **THEN** the dropdown appears directly below the field, left-aligned with it, and is not clipped or shifted by the panel

### Requirement: Name-only lists are edited inline
A resource that consists of little more than a name (such as sections) SHALL be maintained on a single list page: adding, renaming and deleting happen in the list itself, without detail or edit pages.

#### Scenario: Adding
- **WHEN** an admin types a name in the field above the list and presses Enter
- **THEN** the item is added to the list and the field is emptied

#### Scenario: Renaming
- **WHEN** an admin clicks the edit icon of an item, changes the name and presses Enter
- **THEN** the new name is saved and the row shows it; Escape cancels without saving

#### Scenario: Deleting
- **WHEN** an admin clicks the delete icon of an item and confirms
- **THEN** the item is removed from the list
