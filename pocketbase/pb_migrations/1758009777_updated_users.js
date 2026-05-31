/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "resetPasswordTemplate": {
      "body": "<p>Hallo,</p>\n<p>Met onderstaande knop kun je je wachtwoord opnieuw instellen</p>\n<p>\n    <a class=\"btn\" href=\"{APP_URL}/set_password/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Wachtwoord instellen</a>\n</p>\n<p><i>Als je geen wachtwoord reset hebt aangevraagd, kun je deze mail negeren</i></p>\n<p>\n  Bedankt,<br/>\n  {APP_NAME}\n</p>",
      "subject": "Stel je {APP_NAME} wachtwoord opnieuw in"
    }
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "resetPasswordTemplate": {
      "body": "<p>Hallo,</p>\n<p>Met onderstaande knop kun je je wachtwoord opnieuw instellen</p>\n<p>\n    <a class=\"btn\" href=\"{APP_URL}/set_password/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Reset password2</a>\n</p>\n<p><i>Als je geen wachtwoord reset hebt aangevraagd, kun je deze mail negeren</i></p>\n<p>\n  Bedankt,<br/>\n  {APP_NAME}\n</p>",
      "subject": "Reset your {APP_NAME} password"
    }
  }, collection)

  return app.save(collection)
})
