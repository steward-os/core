/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3846174877")

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_4234851150",
    "hidden": false,
    "id": "relation3006502549",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "ledger_account",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3846174877")

  // remove field
  collection.fields.removeById("relation3006502549")

  return app.save(collection)
})
