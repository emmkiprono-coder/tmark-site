export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  const lead = {
    ...req.body,
    id: 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    status: 'new',
    source: req.body.source || 'website',
    capturedAt: new Date().toISOString(),
  };

  try {
    if (KV_URL && KV_TOKEN) {
      const r = await fetch(KV_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['GET', 'tmark-leads']),
      });
      const existing = await r.json();
      const leads = existing.result ? JSON.parse(existing.result) : [];
      leads.unshift(lead);
      await fetch(KV_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', 'tmark-leads', JSON.stringify(leads)]),
      });
    }

    // Trigger follow-up email if Resend is configured
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (RESEND_KEY && lead.email) {
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@tmarkcharters.com';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'TMarK <bookings@tmarkcharters.com>',
          to: [ADMIN_EMAIL],
          subject: `New TMarK Lead: ${lead.name || 'Unknown'} - ${lead.interest || 'General'}`,
          html: `<h3>New Lead Captured</h3>
            <p><strong>Name:</strong> ${lead.name || 'Not provided'}</p>
            <p><strong>Email:</strong> ${lead.email}</p>
            <p><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
            <p><strong>Interest:</strong> ${lead.interest || 'Not specified'}</p>
            <p><strong>Source:</strong> ${lead.source}</p>
            <p><strong>Notes:</strong> ${lead.notes || 'None'}</p>
            <p><strong>Time:</strong> ${lead.capturedAt}</p>`,
        }),
      }).catch(() => {});
    }

    return res.status(201).json({ ok: true, id: lead.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
