const LEAD_EMAIL_TO = Buffer.from('dmFsZXJpaUBtb21lbnR1bW1hdHJpeC5haQ==','base64').toString('utf8');
const CLIENT_EMAIL = Buffer.from('cG53bG9ja3NtaXRob3JAZ21haWwuY29t','base64').toString('utf8');

function clean(value, limit = 2000) {
  return String(value || '').trim().slice(0, limit);
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

async function sendLead(submission) {
  const form = new URLSearchParams();
  form.append('name', submission.name);
  form.append('phone', submission.phone);
  form.append('location', submission.location);
  form.append('service', submission.service);
  form.append('urgency', submission.urgency);
  form.append('details', submission.details);
  form.append('source_page', submission.sourcePage);
  form.append('submitted_at', submission.createdAt);
  form.append('_subject', `Northwest Security & Lock website lead - ${submission.service}`);
  form.append('_template', 'table');
  form.append('_cc', CLIENT_EMAIL);

  const response = await fetch(`https://formsubmit.co/${encodeURIComponent(LEAD_EMAIL_TO)}`, {
    method: 'POST',
    headers: {
      Accept: 'text/html,application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString(),
    redirect: 'follow'
  });

  const responseText = await response.text();
  if (!response.ok) {
    console.error('Northwest lead relay rejected', {
      status: response.status,
      body: responseText.slice(0, 300)
    });
    return false;
  }

  return true;
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
    const emailSent = await sendLead(submission);
    if (!emailSent) {
      return res.status(502).json({ ok: false, message: 'The request could not be delivered right now.' });
    }

    console.log('Northwest Security & Lock lead relayed', {
      service: submission.service,
      location: submission.location,
      emailSent
    });

    return res.status(200).json({
      ok: true,
      message: 'Request sent successfully.'
    });
  } catch (error) {
    console.error('Northwest lead relay error', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(502).json({ ok: false, message: 'The request could not be delivered right now.' });
  }
};
