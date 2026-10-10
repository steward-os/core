/// <reference path="../pb_data/types.d.ts" />
// A message is always sent to one or more groups; sending to all users is no longer possible.
// Existing messages without groups stay visible to everyone, but need a group when edited.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  const field = collection.fields.getById("relation4033689968")
  field.required = true

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_push_msgs_001")

  const field = collection.fields.getById("relation4033689968")
  field.required = false

  return app.save(collection)
})
