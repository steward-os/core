/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3759416719")

  // change source_id from number to text
  collection.fields.removeById("number2503744609")

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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3759416719")

  collection.fields.removeById("text2503744609")

  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number2503744609",
    "max": null,
    "min": null,
    "name": "source_id",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
