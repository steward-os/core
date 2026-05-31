/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1529052917")

  // add field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3759416719",
    "hidden": false,
    "id": "relation1752215990",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "journal_transaction",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1529052917")

  // remove field
  collection.fields.removeById("relation1752215990")

  return app.save(collection)
})
