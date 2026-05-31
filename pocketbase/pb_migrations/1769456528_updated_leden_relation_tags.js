/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1274789205")

  // update collection data
  unmarshal({
    "name": "mb_relation_tags"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1274789205")

  // update collection data
  unmarshal({
    "name": "leden_relation_tags"
  }, collection)

  return app.save(collection)
})
