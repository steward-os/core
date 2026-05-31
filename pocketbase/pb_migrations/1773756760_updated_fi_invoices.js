/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1223779114")

  // add field
  collection.fields.addAt(9, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3846174877",
    "hidden": false,
    "id": "relation2340539087",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "batch_run",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1223779114")

  // remove field
  collection.fields.removeById("relation2340539087")

  return app.save(collection)
})
