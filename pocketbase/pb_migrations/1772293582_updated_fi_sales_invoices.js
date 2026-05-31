/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1223779114")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "date2824557855",
    "max": "",
    "min": "",
    "name": "invoice_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "date3866337329",
    "max": "",
    "min": "",
    "name": "due_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text765886983",
    "max": 0,
    "min": 0,
    "name": "invoice_number",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1223779114")

  // remove field
  collection.fields.removeById("date2824557855")

  // remove field
  collection.fields.removeById("date3866337329")

  // remove field
  collection.fields.removeById("text765886983")

  return app.save(collection)
})
