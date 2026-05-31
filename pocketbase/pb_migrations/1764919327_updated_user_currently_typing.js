/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2280690285")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "bool3564838335",
    "name": "show_live_text",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2280690285")

  // remove field
  collection.fields.removeById("bool3564838335")

  return app.save(collection)
})
