/// <reference path="../pb_data/types.d.ts" />
// Push subscriptions can also come from the Android app. Its rows have platform "android" and keep the
// Firebase Cloud Messaging token in endpoint; they have no p256dh or auth, which only web push needs.
// An empty platform is a web subscription, so existing rows and the web app need no change.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_subs_001")

  collection.fields.getById("text1234567892").required = false
  collection.fields.getById("text1234567893").required = false

  collection.fields.add(new Field({
    "hidden": false,
    "id": "select1791900000",
    "maxSelect": 1,
    "name": "platform",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": ["web", "android"]
  }))

  return app.save(collection)
}, (app) => {
  // Android rows cannot be kept once p256dh and auth are required again.
  app.db().newQuery("DELETE FROM push_subscriptions WHERE platform = 'android'").execute()

  const collection = app.findCollectionByNameOrId("pbc_push_subs_001")

  collection.fields.removeById("select1791900000")
  collection.fields.getById("text1234567892").required = true
  collection.fields.getById("text1234567893").required = true

  return app.save(collection)
})
