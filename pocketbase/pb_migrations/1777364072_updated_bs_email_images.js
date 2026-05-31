/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_226739496")

  // update collection data
  unmarshal({
    "name": "bs_mailing_images"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_226739496")

  // update collection data
  unmarshal({
    "name": "bs_email_images"
  }, collection)

  return app.save(collection)
})
