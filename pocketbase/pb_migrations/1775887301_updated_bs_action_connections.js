/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_185201876")

  // add field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_354729024",
    "hidden": false,
    "id": "relation1204587666",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "action",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_185201876")

  // remove field
  collection.fields.removeById("relation1204587666")

  return app.save(collection)
})
