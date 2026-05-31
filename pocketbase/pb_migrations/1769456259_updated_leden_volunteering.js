/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_801942760")

  // update collection data
  unmarshal({
    "name": "mb_volunteering"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_801942760")

  // update collection data
  unmarshal({
    "name": "leden_volunteering"
  }, collection)

  return app.save(collection)
})
