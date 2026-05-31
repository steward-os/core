/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2501829548")

  // update collection data
  unmarshal({
    "name": "bs_correspondence"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2501829548")

  // update collection data
  unmarshal({
    "name": "bs_emails"
  }, collection)

  return app.save(collection)
})
