/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1428446879")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_entity_polymorphic` ON `bs_updates` (`entity_type`)"
    ]
  }, collection)

  // remove field
  collection.fields.removeById("text_note_polymorphic")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1428446879")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_entity_polymorphic` ON `bs_updates` (`entity_type`, `note`)"
    ]
  }, collection)

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text_note_polymorphic",
    "max": 15,
    "min": 15,
    "name": "note",
    "pattern": "^[a-z0-9]+$",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
