/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2471705857")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_3UMlnB96LE` ON `mb_attendance` (`state`)"
    ],
    "name": "mb_attendance"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2471705857")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_3UMlnB96LE` ON `leden_attendance` (`state`)"
    ],
    "name": "leden_attendance"
  }, collection)

  return app.save(collection)
})
