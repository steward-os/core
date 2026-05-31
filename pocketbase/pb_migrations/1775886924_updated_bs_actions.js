/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_354729024")

  // remove field
  collection.fields.removeById("text2371146282")

  // remove field
  collection.fields.removeById("text2503744609")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_354729024")

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2371146282",
    "max": 0,
    "min": 0,
    "name": "source_type",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2503744609",
    "max": 0,
    "min": 0,
    "name": "source_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
