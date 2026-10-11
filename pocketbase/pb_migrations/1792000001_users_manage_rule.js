/// <reference path="../pb_data/types.d.ts" />
// Admins may manage other users, which lets them set a user's password from the user page
// (without manage access, PocketBase only lets users change their own password with the old one).
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  unmarshal({
    "manageRule": "@request.auth.id != '' && @request.auth.leden_app_admin = true"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  unmarshal({
    "manageRule": null
  }, collection)

  return app.save(collection)
})
