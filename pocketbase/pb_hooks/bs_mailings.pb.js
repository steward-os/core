onRecordAfterUpdateSuccess(async (e) => {
  const record = e.record;

  // Only send when state is "sent"
  if (record.get("state") !== "sent") {
    return;
  }

  // Get form data
  const html = record.get("html");
  const to = record.get("to");
  const subject = record.get("subject");

  // Send email notification
  if (!to) {
    console.error("No recipient address found, skipping email send");
    return;
  }

  try {
    console.log("trying to send mail to:", to);
    const message = new MailerMessage({
      from: { address: $app.settings().meta.senderAddress, name: $app.settings().meta.senderName },
      to: [{ address: to }],
      subject: subject,
      html: html,
    });

    $app.newMailClient().send(message);
    console.log("Contact form email sent successfully");
  } catch (err) {
    console.error("Failed to send contact form email:", err);
  }
}, "bs_mailings");
