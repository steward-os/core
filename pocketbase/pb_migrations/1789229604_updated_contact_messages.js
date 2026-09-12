/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_contact_messages")

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text4224597626",
    "max": 0,
    "min": 0,
    "name": "subject",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_contact_messages")

  // remove field
  collection.fields.removeById("text4224597626")

  return app.save(collection)
})
