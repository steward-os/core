/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1428446879")

  // add entity_type field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3485334037",
    "max": 0,
    "min": 0,
    "name": "entity_type",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false, // Set to false initially to allow existing records
    "system": false,
    "type": "text"
  }))

  // add composite index for performance
  collection.indexes = [
    "CREATE INDEX `idx_entity_polymorphic` ON `bs_updates` (`entity_type`, `note`)"
  ]

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1428446879")

  // remove field
  collection.fields.removeById("text3485334037")

  // remove index
  collection.indexes = []

  return app.save(collection)
})