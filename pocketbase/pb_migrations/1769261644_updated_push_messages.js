/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.auth.leden_app_push_admin = true",
    "deleteRule": "@request.auth.id != \"\" && @request.auth.leden_app_push_admin = true",
    "listRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\" && @request.auth.leden_app_push_admin = true",
    "viewRule": "@request.auth.id != \"\""
  }, collection)

  return app.save(collection)
})
