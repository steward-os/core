/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3845635313")

  // update collection data
  unmarshal({
    "name": "mb_groups"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3845635313")

  // update collection data
  unmarshal({
    "name": "orchestras"
  }, collection)

  return app.save(collection)
})
