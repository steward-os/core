/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2673868957")

  // remove type field
  collection.fields.removeById("select2363381545")

  // remove assigned field
  collection.fields.removeById("relation194694298")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2673868957")

  // add back type field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select2363381545",
    "maxSelect": 1,
    "name": "type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "note",
      "task",
      "decision"
    ]
  }))

  // add back assigned field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation194694298",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "assigned",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})