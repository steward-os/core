/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3846174877")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "file2406807715",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "sepa_file",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3846174877")

  // remove field
  collection.fields.removeById("file2406807715")

  return app.save(collection)
})
