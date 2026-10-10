/// <reference path="../pb_data/types.d.ts" />
// Reaction buttons are typed per message (`reaction_options`, a list of strings) instead of being
// picked from the shared standard reactions. A user's reaction stores the chosen text.
// Existing reactions are dropped; the down migration restores the schema, not the data.
migrate((app) => {
  const reactions = app.findCollectionByNameOrId("pbc_message_reactions")
  app.truncateCollection(reactions)

  reactions.fields.removeById("relation4628193750")
  reactions.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text6402918375",
    "max": 100,
    "min": 1,
    "name": "reaction",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_message_user_reaction` ON `mb_message_reactions` (`message`, `user`, `reaction`)"
    ]
  }, reactions)
  app.save(reactions)

  const messages = app.findCollectionByNameOrId("pbc_push_msgs_001")
  messages.fields.removeById("relation8472910365")
  messages.fields.addAt(6, new Field({
    "hidden": false,
    "id": "json5281937460",
    "maxSize": 0,
    "name": "reaction_options",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))
  app.save(messages)

  return app.delete(app.findCollectionByNameOrId("pbc_standard_reactions"))
}, (app) => {
  const standard = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1928379451",
        "max": 0,
        "min": 0,
        "name": "emoji",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2837465190",
        "max": 0,
        "min": 0,
        "name": "reaction",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_standard_reactions",
    "indexes": [],
    "listRule": "@request.auth.id != ''",
    "name": "mb_standard_message_reactions",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": "@request.auth.id != ''"
  })
  app.save(standard)

  const messages = app.findCollectionByNameOrId("pbc_push_msgs_001")
  messages.fields.removeById("json5281937460")
  messages.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_standard_reactions",
    "hidden": false,
    "id": "relation8472910365",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "standard_message_reactions",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))
  app.save(messages)

  const reactions = app.findCollectionByNameOrId("pbc_message_reactions")
  app.truncateCollection(reactions)
  reactions.fields.removeById("text6402918375")
  reactions.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_standard_reactions",
    "hidden": false,
    "id": "relation4628193750",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "standard_reaction",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_message_user_reaction` ON `mb_message_reactions` (`message`, `user`, `standard_reaction`)"
    ]
  }, reactions)
  return app.save(reactions)
})
