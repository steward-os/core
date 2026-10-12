/// <reference path="../pb_data/types.d.ts" />
// A message goes to exactly one group, optionally narrowed to sections of that group.
// - groups (multi) becomes group (single, required); existing messages keep their first group and
//   messages without a group are deleted (their reactions and read markers cascade).
// - sections (multi, optional): empty means everyone in the group.
// - API rules: only logged-in users who are in the message's group, sent it, or are app admin can
//   read it; only senders with can_send_messages (or app admins) can create; only the sender or an
//   app admin can change or delete. The section filter itself is applied by the inbox and push hook.
const GROUPS_ID = "relation4033689968"
const GROUP_ID = "relation2052834903"
const SECTIONS_ID = "relation1131226478"

migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  collection.fields.add(new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3845635313",
    "hidden": false,
    "id": GROUP_ID,
    "maxSelect": 1,
    "minSelect": 0,
    "name": "group",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))
  collection.fields.add(new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1809324929",
    "hidden": false,
    "id": SECTIONS_ID,
    "maxSelect": 999,
    "minSelect": 0,
    "name": "sections",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))
  app.save(collection)

  for (const record of app.findAllRecords("mb_messages")) {
    const groups = record.get("groups")
    if (!groups || groups.length === 0) {
      app.delete(record)
      continue
    }
    record.set("group", groups[0])
    app.saveNoValidate(record)
  }

  const updated = app.findCollectionByNameOrId("pbc_push_msgs_001")
  updated.fields.getById(GROUP_ID).required = true
  updated.fields.removeById(GROUPS_ID)

  updated.listRule = "@request.auth.id != \"\" && (sender = @request.auth.id || @request.auth.leden_app_admin = true || group.mb_group_members_via_group.user ?= @request.auth.id)"
  updated.viewRule = updated.listRule
  updated.createRule = "@request.auth.id != \"\" && (@request.auth.can_send_messages = true || @request.auth.leden_app_admin = true)"
  updated.updateRule = "@request.auth.id != \"\" && (sender = @request.auth.id || @request.auth.leden_app_admin = true)"
  updated.deleteRule = updated.updateRule

  return app.save(updated)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  collection.fields.add(new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3845635313",
    "hidden": false,
    "id": GROUPS_ID,
    "maxSelect": 999,
    "minSelect": 0,
    "name": "groups",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))
  app.save(collection)

  for (const record of app.findAllRecords("mb_messages")) {
    record.set("groups", [record.get("group")])
    app.saveNoValidate(record)
  }

  const updated = app.findCollectionByNameOrId("pbc_push_msgs_001")
  updated.fields.getById(GROUPS_ID).required = true
  updated.fields.removeById(GROUP_ID)
  updated.fields.removeById(SECTIONS_ID)

  updated.listRule = ""
  updated.viewRule = ""
  updated.createRule = ""
  updated.updateRule = ""
  updated.deleteRule = ""

  return app.save(updated)
})
