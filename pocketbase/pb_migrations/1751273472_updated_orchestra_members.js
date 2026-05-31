/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3067646489")

  // add field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3845635313",
    "hidden": false,
    "id": "relation2302896640",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "orchestra",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3067646489")

  // remove field
  collection.fields.removeById("relation2302896640")

  return app.save(collection)
})
