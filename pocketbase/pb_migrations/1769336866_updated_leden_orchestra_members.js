/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3067646489")

  // update collection data
  unmarshal({
    "name": "mb_group_members"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3067646489")

  // update collection data
  unmarshal({
    "name": "leden_orchestra_members"
  }, collection)

  return app.save(collection)
})
