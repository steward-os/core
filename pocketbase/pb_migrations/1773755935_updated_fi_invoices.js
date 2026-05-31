/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1223779114")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "file56160669",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "sepa",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1223779114")

  // remove field
  collection.fields.removeById("file56160669")

  return app.save(collection)
})
