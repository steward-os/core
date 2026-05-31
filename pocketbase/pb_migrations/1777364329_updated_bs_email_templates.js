/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_692345759")

  // update collection data
  unmarshal({
    "name": "bs_mailing_templates"
  }, collection)

  // remove field
  collection.fields.removeById("json4274335913")

  // remove field
  collection.fields.removeById("editor410646757")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_692345759")

  // update collection data
  unmarshal({
    "name": "bs_email_templates"
  }, collection)

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "json4274335913",
    "maxSize": 0,
    "name": "content",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor410646757",
    "maxSize": 0,
    "name": "html",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  return app.save(collection)
})
