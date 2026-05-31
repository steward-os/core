/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3266612317")

  // update collection data
  unmarshal({
    "name": "bs_meeting_templates"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3266612317")

  // update collection data
  unmarshal({
    "name": "bs_meeting_template"
  }, collection)

  return app.save(collection)
})
