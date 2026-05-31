/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_music_recordings")

  // update collection data
  unmarshal({
    "name": "mb_music_recordings"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_music_recordings")

  // update collection data
  unmarshal({
    "name": "leden_music_recordings"
  }, collection)

  return app.save(collection)
})
