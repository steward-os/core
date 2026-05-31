/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != '' && @request.body.user = @request.auth.id",
    "deleteRule": "@request.auth.id != '' && user = @request.auth.id",
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
        "cascadeDelete": true,
        "collectionId": "pbc_push_msgs_001",
        "hidden": false,
        "id": "relation7391825460",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "message",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation5829374610",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
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
    "id": "pbc_message_reactions",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_message_user_reaction` ON `mb_message_reactions` (`message`, `user`, `standard_reaction`)"
    ],
    "listRule": "@request.auth.id != ''",
    "name": "mb_message_reactions",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": "@request.auth.id != ''"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_message_reactions");

  return app.delete(collection);
})
