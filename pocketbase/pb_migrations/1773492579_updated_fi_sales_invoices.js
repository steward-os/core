/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1223779114")

  // update collection data
  unmarshal({
    "name": "fi_invoices"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1223779114")

  // update collection data
  unmarshal({
    "name": "fi_sales_invoices"
  }, collection)

  return app.save(collection)
})
