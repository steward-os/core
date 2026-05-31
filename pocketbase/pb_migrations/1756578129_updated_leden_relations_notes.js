/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3030847938")

  // update collection data
  unmarshal({
    "name": "leden_relation_notes"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3030847938")

  // update collection data
  unmarshal({
    "name": "leden_relations_notes"
  }, collection)

  return app.save(collection)
})
