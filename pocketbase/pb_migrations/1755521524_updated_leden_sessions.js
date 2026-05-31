/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3660498186")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "select205078978",
    "maxSelect": 1,
    "name": "default_attendance_state",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "will_be_present",
      "wont_be_present"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3660498186")

  // update field
  collection.fields.addAt(5, new Field({
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
})
