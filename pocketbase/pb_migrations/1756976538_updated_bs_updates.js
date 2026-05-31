/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1428446879")

  // add field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1910422292",
    "hidden": false,
    "id": "relation3485334036",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "note",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1428446879")

  // remove field
  collection.fields.removeById("relation3485334036")

  return app.save(collection)
})
