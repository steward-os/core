/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_subs_001")

  // Allow app admins to list/view all subscriptions (needed for delivery reporting)
  unmarshal({
    "listRule": "@request.auth.leden_app_admin = true || @request.auth.id = user.id",
    "viewRule": "@request.auth.leden_app_admin = true || @request.auth.id = user.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_subs_001")

  unmarshal({
    "listRule": "@request.auth.id = user.id",
    "viewRule": "@request.auth.id = user.id"
  }, collection)

  return app.save(collection)
})
