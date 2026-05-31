/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_301846853")

  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number3479021417",
    "max": null,
    "min": null,
    "name": "sort_order",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_301846853")
  collection.fields.removeById("number3479021417")
  return app.save(collection)
})
