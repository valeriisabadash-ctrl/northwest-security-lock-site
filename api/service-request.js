const FORM_ENDPOINT = "https://formsubmit.co/ajax/pnwlocksmithor@gmail.com";

function clean(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: bots can think the request succeeded without generating email.
  if (clean(body._honey, 200)) {
    return res.status(200).json({ success: true });
  }

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 60);
  const location = clean(body.location, 120);
  const service = clean(body.service, 120);
  const urgency = clean(body.urgency, 120);
  const details = clean(body.details, 4000);
  const pageUrl = clean(body.pageUrl, 500);

  if (!name || !phone || !location || !service || !urgency || !details) {
    return res.status(400).json({
      success: false,
      message: "Please complete every required field."
    });
  }

  const payload = {
    name,
    phone,
    location,
    service,
    urgency,
    details,
    _subject: `New website service request — ${service}`,
    _template: "table",
    _captcha: "false",
    _url: "https://www.northwestsecurityandlocks.com/",
    "Submitted from": pageUrl || "https://www.northwestsecurityandlocks.com/",
    "Request summary": `${service} — ${urgency}`
  };

  try {
    const upstream = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    const raw = await upstream.text();
    let result = {};

    try {
      result = raw ? JSON.parse(raw) : {};
    } catch {
      result = {};
    }

    const succeeded =
      upstream.ok && (result.success === true || result.success === "true");

    if (!succeeded) {
      console.error("FormSubmit rejected service request", {
        status: upstream.status,
        message: clean(result.message, 300)
      });
      return res.status(502).json({
        success: false,
        message: "The request could not be delivered."
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Service request delivery failed", {
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return res.status(502).json({
      success: false,
      message: "The request could not be delivered."
    });
  }
}
