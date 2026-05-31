onRecordAfterCreateSuccess(async (e) => {
  const record = e.record;

  // Get form data
  const firstName = record.get("first_name");
  const lastName = record.get("last_name");
  const email = record.get("email");
  const subject = record.get("subject");
  const message = record.get("message");
  const created = record.created;
  const website = record.get("website");

  // Route to the address configured in PocketBase settings.
  // Override per hostname via env var: CONTACT_EMAIL_<hostname with dots as underscores>
  // e.g. CONTACT_EMAIL_mysite_nl=info@mysite.nl
  const envKey = "CONTACT_EMAIL_" + (website || "").replace(/\./g, "_");
  const to = process.env[envKey] || $app.settings().meta.senderAddress;

  // Create email content
  const textContent = `
Contact formulier ingevuld door ${firstName} ${lastName}

Email: ${email}
Onderwerp: ${subject}

Bericht:
${message}
    `;

  const htmlContent = `
        <h2>Contact formulier ${website} ingevuld door</h2>
        <p><strong>Van:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Onderwerp:</strong> ${subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
        <hr>
    `;

  // Send email notification
  try {
    const message = new MailerMessage({
      from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName,
      },
      to: [{ address: to }],
      subject: `Contact Formulier: ${subject}`,
      text: textContent,
      html: htmlContent,
    });

    $app.newMailClient().send(message);
    console.log("Contact form email sent successfully");
  } catch (err) {
    console.error("Failed to send contact form email:", err);
  }
}, "contact_messages");
