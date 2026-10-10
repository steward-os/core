/// <reference path="../pb_data/types.d.ts" />
// Which messages a user has opened, so the web app and the Android app show the others as new, the
// same on every device. Users only see and add their own reads; a read goes with its message or user.
// Every existing message counts as read for every existing user, so nothing turns up as new at once.
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != '' && @request.body.user = @request.auth.id",
    "deleteRule": null,
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
        "id": "relation4510927384",
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
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation8263015947",
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
    "id": "pbc_message_reads",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_message_reads_message_user` ON `mb_message_reads` (`message`, `user`)",
      "CREATE INDEX `idx_message_reads_user` ON `mb_message_reads` (`user`)"
    ],
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "name": "mb_message_reads",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": "@request.auth.id != '' && user = @request.auth.id"
  })
  app.save(collection)

  // In one statement rather than a record per pair: 15 random [a-z0-9] characters as the id.
  app.db().newQuery(`
    INSERT INTO mb_message_reads (id, message, user, created, updated)
    SELECT substr(lower(hex(randomblob(8))), 1, 15), m.id, u.id,
           strftime('%Y-%m-%d %H:%M:%fZ', 'now'), strftime('%Y-%m-%d %H:%M:%fZ', 'now')
    FROM mb_messages m CROSS JOIN users u
  `).execute()
}, (app) => {
  return app.delete(app.findCollectionByNameOrId("pbc_message_reads"))
})
