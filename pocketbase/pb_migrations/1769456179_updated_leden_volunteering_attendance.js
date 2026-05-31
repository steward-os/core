/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1587533298")

  // update collection data
  unmarshal({
    "name": "mb_volunteering_attendance"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1587533298")

  // update collection data
  unmarshal({
    "name": "leden_volunteering_attendance"
  }, collection)

  return app.save(collection)
})
