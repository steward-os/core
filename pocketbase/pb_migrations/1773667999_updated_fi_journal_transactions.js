/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3759416719")

  // remove field
  collection.fields.removeById("number2503744609")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3759416719")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number2503744609",
    "max": null,
    "min": null,
    "name": "source_id",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
