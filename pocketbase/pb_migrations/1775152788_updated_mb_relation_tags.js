/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1274789205")

  // update collection data
  unmarshal({
    "name": "sys_tags"
  }, collection)

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2363381545",
    "max": 0,
    "min": 0,
    "name": "type",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1274789205")

  // update collection data
  unmarshal({
    "name": "mb_relation_tags"
  }, collection)

  // remove field
  collection.fields.removeById("text2363381545")

  return app.save(collection)
})
