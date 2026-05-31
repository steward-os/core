/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4234851150")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "bool1931271636",
    "name": "is_bank_account",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4234851150")

  // remove field
  collection.fields.removeById("bool1931271636")

  return app.save(collection)
})
