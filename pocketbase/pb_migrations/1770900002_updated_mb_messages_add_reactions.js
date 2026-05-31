/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  // add field
  collection.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_standard_reactions",
    "hidden": false,
    "id": "relation8472910365",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "standard_message_reactions",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  // remove field
  collection.fields.removeById("relation8472910365")

  return app.save(collection)
})
