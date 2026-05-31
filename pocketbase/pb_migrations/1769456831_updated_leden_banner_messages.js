/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3078044967")

  // update collection data
  unmarshal({
    "name": "mb_banner_messages"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3078044967")

  // update collection data
  unmarshal({
    "name": "leden_banner_messages"
  }, collection)

  return app.save(collection)
})
