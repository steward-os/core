/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  // update collection data
  unmarshal({
    "name": "mb_messages"
  }, collection)

  // add field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3845635313",
    "hidden": false,
    "id": "relation4033689968",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "groups",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  // update collection data
  unmarshal({
    "name": "push_messages"
  }, collection)

  // remove field
  collection.fields.removeById("relation4033689968")

  return app.save(collection)
})
