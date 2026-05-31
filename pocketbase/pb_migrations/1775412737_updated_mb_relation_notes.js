/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3030847938")

  // update collection data
  unmarshal({
    "name": "bs_relation_notes"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3030847938")

  // update collection data
  unmarshal({
    "name": "mb_relation_notes"
  }, collection)

  return app.save(collection)
})
