/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3660498186")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "bool2018830574",
    "name": "volunteering",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3660498186")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "bool2018830574",
    "name": "volunteering",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
