const CLIENT_EMAIL = process.env.LEAD_EMAIL_TO || 'pnwlocksmithor@gmail.com';
const FROM_EMAIL = process.env.LEAD_EMAIL_FROM || 'Northwest Website <leads@northwestsecurityandlocks.com>';

function clean(value, limit = 2000) {
  return String(value || '').trim().slice(0, limit);
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendLead(submission) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const subject = `Northwest Security & Lock website lead - ${submission.service}`;
  const text = [
    'New Northwest Security & Lock website lead',
    '',
    `Name: ${submission.name}`,
    `Phone: ${submission.phone}`,
    `City or ZIP: ${submission.location}`,
    `Service: ${submission.service}`,
    `Urgency: ${submission.urgency}`,
    '',
    'Details:',
    submission.details,
    '',
    `Source: ${submission.sourcePage}`,
    `Submitted: ${submission.createdAt}`
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111827">
      <h2 style="margin:0 0 20px">New Northwest Security &amp; Lock website lead</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-weight:700;width:140px">Name</td><td>${escapeHtml(submission.name)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Phone</td><td>${escapeHtml(submission.phone)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">City or ZIP</td><td>${escapeHtml(submission.location)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Service</td><td>${escapeHtml(submission.service)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Urgency</td><td>${escapeHtml(submission.urgency)}</td></tr>
      </table>
      <div style="margin-top:20px">
        <div style="font-weight:700;margin-bottom:6px">Details</div>
        <div style="white-space:pre-wrap;line-height:1.5">${escapeHtml(submission.details)}</div>
      </div>
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0">
      <div style="font-size:12px;color:#6b7280">Source: ${escapeHtml(submission.sourcePage)}<br>Submitted: ${escapeHtml(submission.createdAt)}</div>
    </div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [CLIENT_EMAIL],
      subject,
      text,
      html,
      tags: [
        { name: 'source', value: 'northwest-website' },
        { name: 'service', value: clean(submission.service, 40).toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'unknown' }
      ]
    })
  });

  let result = {};
  try {
    result = await response.json();
  } catch (_) {}

  if (!response.ok || !result.id) {
    console.error('Resend rejected Northwest lead email', {
      status: response.status,
      message: result?.message || result?.name || 'Unknown Resend error'
    });
    return { ok: false };
  }

  return { ok: true, emailId: result.id };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Use POST.' });
  }

  const body = req.body || {};
  if (clean(body._honey, 200)) return res.status(200).json({ ok: true });

  const phone = clean(body.phone, 80);
  const submission = {
    createdAt: new Date().toISOString(),
    name: clean(body.name, 120),
    phone,
    location: clean(body.location, 120),
    service: clean(body.service, 120),
    urgency: clean(body.urgency, 120),
    details: clean(body.details, 4000),
    sourcePage: clean(body.sourcePage || 'https://www.northwestsecurityandlocks.com/', 500)
  };

  if (!submission.name || !submission.phone || !submission.location || !submission.service || !submission.urgency || !submission.details) {
    return res.status(400).json({ ok: false, message: 'Please complete every required field.' });
  }

  const phoneDigits = digitsOnly(phone);
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return res.status(400).json({ ok: false, message: 'Please enter a valid phone number.' });
  }

  try {
    const delivery = await sendLead(submission);
    if (!delivery.ok) {
      return res.status(502).json({ ok: false, message: 'The request could not be delivered right now.' });
    }

    console.log('Northwest Security & Lock lead sent with Resend', {
      service: submission.service,
      location: submission.location,
      emailId: delivery.emailId
    });

    return res.status(200).json({
      ok: true,
      message: 'Request sent successfully.'
    });
  } catch (error) {
    console.error('Northwest Resend delivery error', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(502).json({ ok: false, message: 'The request could not be delivered right now.' });
  }
};
