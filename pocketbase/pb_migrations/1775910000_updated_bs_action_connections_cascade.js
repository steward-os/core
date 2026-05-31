/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_185201876")

  const field = collection.fields.getById("relation1204587666")
  field.cascadeDelete = true
  collection.fields.add(field)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_185201876")

  const field = collection.fields.getById("relation1204587666")
  field.cascadeDelete = false
  collection.fields.add(field)

  return app.save(collection)
})
