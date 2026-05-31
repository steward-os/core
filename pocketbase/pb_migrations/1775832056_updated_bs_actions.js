/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_354729024")

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "date2482226890",
    "max": "",
    "min": "",
    "name": "datetime",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_354729024")

  // remove field
  collection.fields.removeById("date2482226890")

  return app.save(collection)
})
