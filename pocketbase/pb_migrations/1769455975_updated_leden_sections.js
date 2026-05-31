/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1809324929")

  // update collection data
  unmarshal({
    "name": "mb_sections"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1809324929")

  // update collection data
  unmarshal({
    "name": "leden_sections"
  }, collection)

  return app.save(collection)
})
