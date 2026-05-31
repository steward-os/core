/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2471705857")

  // update collection data
  unmarshal({
    "name": "leden_attendance"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2471705857")

  // update collection data
  unmarshal({
    "name": "attendance"
  }, collection)

  return app.save(collection)
})
