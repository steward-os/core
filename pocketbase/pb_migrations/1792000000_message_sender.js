/// <reference path="../pb_data/types.d.ts" />
// A message remembers who sent it, for the "Verzonden" list. The hook in push_messages.pb.js sets it
// to the logged-in user on create. Existing messages have no sender and only show under "Ontvangen".
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  collection.fields.add(new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation7315904826",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "sender",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  collection.fields.removeById("relation7315904826")

  return app.save(collection)
})
