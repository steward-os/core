/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2673868957")

  // add field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_42434774",
    "hidden": false,
    "id": "relation4111851833",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "meeting",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2673868957")

  // remove field
  collection.fields.removeById("relation4111851833")

  return app.save(collection)
})
