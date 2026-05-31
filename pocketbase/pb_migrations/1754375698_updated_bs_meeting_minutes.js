/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1910422292")

  // update collection data
  unmarshal({
    "name": "bs_notes"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1910422292")

  // update collection data
  unmarshal({
    "name": "bs_meeting_minutes"
  }, collection)

  return app.save(collection)
})
