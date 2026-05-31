/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3759416719")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "bool1132359036",
    "name": "is_closing",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3759416719")

  // remove field
  collection.fields.removeById("bool1132359036")

  return app.save(collection)
})
