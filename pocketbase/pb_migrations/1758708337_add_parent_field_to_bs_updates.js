/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1428446879")

  // Add a new 'parent' field as plain text for polymorphic IDs
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text_parent_polymorphic",
    "max": 15,
    "min": 15,
    "name": "parent",
    "pattern": "^[a-z0-9]+$",
    "presentable": false,
    "primaryKey": false,
    "required": false, // Optional for gradual migration
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1428446879")

  // Remove the parent field
  collection.fields.removeById("text_parent_polymorphic")

  return app.save(collection)
})