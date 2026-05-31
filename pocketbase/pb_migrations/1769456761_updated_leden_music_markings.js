/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1498154962")

  // update collection data
  unmarshal({
    "name": "mb_music_markings"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1498154962")

  // update collection data
  unmarshal({
    "name": "leden_music_markings"
  }, collection)

  return app.save(collection)
})
