/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_801942760")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number1452894939",
    "max": null,
    "min": null,
    "name": "number_needed",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_801942760")

  // remove field
  collection.fields.removeById("number1452894939")

  return app.save(collection)
})
