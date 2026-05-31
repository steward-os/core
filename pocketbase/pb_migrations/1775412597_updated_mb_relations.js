/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1883866059")

  // update collection data
  unmarshal({
    "name": "bs_relations"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1883866059")

  // update collection data
  unmarshal({
    "name": "mb_relations"
  }, collection)

  return app.save(collection)
})
