/// <reference path="../pb_data/types.d.ts" />
// One-time login by e-mail for the Android app: the mail carries a link that opens the app
// ({APP_URL}/login/otp, see pb_hooks/app_links.pb.js) and the code itself as a fallback.
// Valid for 15 minutes instead of 3, as people first have to switch to their mail.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  unmarshal({
    "otp": {
      "duration": 900,
      "emailTemplate": {
        "subject": "Inloggen bij {APP_NAME}",
        "body": "<p>Hallo,</p>\n<p>Tik op deze telefoon op de knop hieronder om in te loggen in de app van {APP_NAME}.</p>\n<p>\n  <a href=\"{APP_URL}/login/otp?id={OTP_ID}&code={OTP}\" style=\"display:inline-block;padding:12px 24px;border-radius:24px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:600\">Inloggen</a>\n</p>\n<p>Werkt de knop niet? Vul dan deze code in de app in: <strong>{OTP}</strong></p>\n<p>De knop en de code zijn 15 minuten geldig en werken maar één keer.</p>\n<p><i>Heb je hier niet om gevraagd? Dan kun je deze e-mail negeren.</i></p>\n<p>\n  Groeten,<br/>\n  {APP_NAME}\n</p>"
      }
    }
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  unmarshal({
    "otp": {
      "duration": 180,
      "emailTemplate": {
        "subject": "OTP for {APP_NAME}",
        "body": "<p>Hello,</p>\n<p>Your one-time password is: <strong>{OTP}</strong></p>\n<p>\n  <a href=\"http://localhost:5173?otp={OTP}\">magic link</a>\n</p>\n<p><i>If you didn't ask for the one-time password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>"
      }
    }
  }, collection)

  return app.save(collection)
})
