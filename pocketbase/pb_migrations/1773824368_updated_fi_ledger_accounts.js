/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4234851150")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "bool4206294472",
    "name": "is_suspense_account",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4234851150")

  // remove field
  collection.fields.removeById("bool4206294472")

  return app.save(collection)
})
