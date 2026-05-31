/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_801942760")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number2294395513",
    "max": null,
    "min": null,
    "name": "number_orange",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number2352121510",
    "max": null,
    "min": null,
    "name": "number_red",
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
  collection.fields.removeById("number2294395513")

  // remove field
  collection.fields.removeById("number2352121510")

  return app.save(collection)
})
