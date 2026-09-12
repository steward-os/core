/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_contact_messages")

  // remove field
  collection.fields.removeById("select3004")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_contact_messages")

  // add field
  collection.fields.addAt(4, new Field({
    "help": "",
    "hidden": false,
    "id": "select3004",
    "maxSelect": 1,
    "name": "subject",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "membership",
      "concerts",
      "booking",
      "general",
      "other"
    ]
  }))

  return app.save(collection)
})
