/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3660498186")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select205078978",
    "maxSelect": 1,
    "name": "default_attendance_state",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "will_be_present"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3660498186")

  // remove field
  collection.fields.removeById("select205078978")

  return app.save(collection)
})
