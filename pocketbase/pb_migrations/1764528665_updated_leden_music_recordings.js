/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_music_recordings")

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number1493879504",
    "max": null,
    "min": null,
    "name": "offset",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_music_recordings")

  // remove field
  collection.fields.removeById("number1493879504")

  return app.save(collection)
})
