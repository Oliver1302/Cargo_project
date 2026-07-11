// Both functions log and return { sent: false } if the relevant API keys aren't set yet —
// this lets every notification call-site in the app be written unconditionally, without
// littering "if configured" checks everywhere else.

export async function sendWhatsApp(to, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "+14155238886" (Twilio sandbox number)

  if (!sid || !authToken || !from) {
    console.log(`[WhatsApp not configured] Would send to ${to}: ${message}`);
    return { sent: false };
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        From: `whatsapp:${from}`,
        To: `whatsapp:${to}`,
        Body: message
      })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Twilio WhatsApp error:", data.message);
      return { sent: false, error: data.message };
    }
    return { sent: true };
  } catch (err) {
    console.error("WhatsApp send error:", err.message);
    return { sent: false, error: err.message };
  }
}

export async function sendEmail(to, subject, body) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || !to) {
    console.log(`[Email not configured] Would send to ${to}: ${subject}`);
    return { sent: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Freightly <onboarding@resend.dev>",
        to,
        subject,
        text: body
      })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Resend email error:", data.message);
      return { sent: false, error: data.message };
    }
    return { sent: true };
  } catch (err) {
    console.error("Email send error:", err.message);
    return { sent: false, error: err.message };
  }
}

export async function getClientEmail(pool, customerId) {
  const { rows } = await pool.query(
    "SELECT email FROM users WHERE customer_id = $1 AND scope = 'client' LIMIT 1",
    [customerId]
  );
  return rows[0]?.email || null;
}

// SMS via Africa's Talking — works on any network, even 2G, unlike WhatsApp which needs
// data. Falls back to console logging if no API key is set.
export async function sendSMS(to, message) {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;

  if (!apiKey || !username) {
    console.log(`[SMS not configured] Would send to ${to}: ${message}`);
    return { sent: false };
  }

  try {
    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: new URLSearchParams({ username, to, message })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Africa's Talking SMS error:", data);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("SMS send error:", err.message);
    return { sent: false, error: err.message };
  }
}

// M-Pesa STK Push stub (Safaricom Daraja API). This is intentionally shallow — going live
// needs a registered paybill/till number and Daraja app credentials, which come after you
// have a business bank account set up with Safaricom. Wire the real request in once that
// exists; the call-site (portalInvoiceRoutes) doesn't need to change.
export async function initiateMpesaPush(phone, amount) {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const paybillNumber = process.env.MPESA_PAYBILL_NUMBER;

  if (!consumerKey || !paybillNumber) {
    console.log(
      `[M-Pesa not configured] Would send STK push to ${phone} for KES ${amount}. ` +
        `Needs a Safaricom paybill/till number and Daraja API credentials to go live.`
    );
    return { initiated: false, reason: "M-Pesa isn't connected yet — this is a placeholder." };
  }

  // Real Daraja STK Push call goes here once you have credentials — same shape as the
  // Twilio/Resend calls above (OAuth token, then POST to the STK Push endpoint).
  console.log("M-Pesa credentials found but live STK push isn't implemented yet.");
  return { initiated: false, reason: "Daraja integration not yet built — credentials detected but unused." };
}
