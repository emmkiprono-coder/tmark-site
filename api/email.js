export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'TMarK Charters <bookings@tmarkcharters.com>';
  if (!API_KEY) return res.status(500).json({ error: 'Resend not configured' });

  const { to, template, data } = req.body;
  if (!to) return res.status(400).json({ error: 'Email required' });

  const d = data || {};

  const brandHeader = `
    <div style="background:linear-gradient(135deg,#0a1628,#1a2d4a);padding:32px 24px;text-align:center;">
      <h1 style="color:#d4a843;font-family:Georgia,serif;font-size:24px;margin:0;letter-spacing:3px;">TMarK</h1>
      <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:4px 0 0;letter-spacing:2px;">YOUR PASSPORT TO WATERWAYS</p>
    </div>`;

  const brandFooter = `
    <div style="background:#f5f7fa;padding:24px;text-align:center;font-size:13px;color:#6b7a90;">
      <p style="margin:0 0 8px;">TMarK Charters | Montrose Harbor, Chicago IL</p>
      <p style="margin:0 0 8px;">(312) 555-0100 | info@tmarkcharters.com</p>
      <p style="margin:0;color:#a0aabb;font-size:11px;">From Water to Wonder</p>
    </div>`;

  const templates = {
    booking_confirmation: {
      subject: `Your TMarK ${d.experience || 'Charter'} is Confirmed!`,
      html: `${brandHeader}
        <div style="padding:32px 24px;font-family:Arial,sans-serif;color:#1a202c;">
          <h2 style="color:#0a1628;margin:0 0 16px;">Welcome Aboard, ${d.name || 'Guest'}!</h2>
          <p style="color:#4a5568;line-height:1.7;">Your ${d.experience || 'charter'} experience has been confirmed. Here are your booking details:</p>
          <div style="background:#f5f7fa;border-radius:12px;padding:24px;margin:20px 0;border-left:4px solid #d4a843;">
            <table style="width:100%;font-size:14px;color:#4a5568;">
              <tr><td style="padding:6px 0;font-weight:bold;width:120px;">Vessel</td><td>${d.vessel || 'TBD'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Date</td><td>${d.date || 'TBD'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Time</td><td>${d.time || 'TBD'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Duration</td><td>${d.hours || 'TBD'} hours</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Guests</td><td>${d.guests || 'TBD'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Deposit Paid</td><td style="color:#d4a843;font-weight:bold;">$${d.deposit || '0'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Balance Due</td><td>$${d.balance || '0'} (due day-of)</td></tr>
            </table>
          </div>
          <h3 style="color:#0a1628;margin:24px 0 8px;">What to Bring</h3>
          <ul style="color:#4a5568;line-height:2;padding-left:20px;">
            <li>Sunscreen and sunglasses</li>
            <li>Non-marking shoes (soft sole)</li>
            <li>Light jacket (it's cooler on the water)</li>
            <li>Your own food and drinks (BYO welcome!)</li>
            <li>Camera for the views</li>
          </ul>
          <h3 style="color:#0a1628;margin:24px 0 8px;">Meeting Point</h3>
          <p style="color:#4a5568;line-height:1.7;">Montrose Harbor, Chicago. We'll send exact dock instructions and parking info 24 hours before your charter.</p>
          <p style="color:#4a5568;line-height:1.7;margin-top:20px;">Questions? Reply to this email or call (312) 555-0100.</p>
          <p style="color:#d4a843;font-weight:bold;margin-top:24px;">See you on the water!</p>
          <p style="color:#4a5568;">Captain Kip & the TMarK Crew</p>
        </div>${brandFooter}`,
    },

    booking_reminder: {
      subject: `Tomorrow: Your TMarK ${d.experience || 'Charter'}!`,
      html: `${brandHeader}
        <div style="padding:32px 24px;font-family:Arial,sans-serif;color:#1a202c;">
          <h2 style="color:#0a1628;margin:0 0 16px;">Your Adventure is Tomorrow!</h2>
          <p style="color:#4a5568;line-height:1.7;">${d.name || 'Guest'}, your ${d.experience || 'charter'} on the <strong>${d.vessel || 'TMarK'}</strong> is set for tomorrow.</p>
          <div style="background:#f5f7fa;border-radius:12px;padding:24px;margin:20px 0;">
            <p style="margin:0 0 8px;"><strong>Date:</strong> ${d.date || 'Tomorrow'}</p>
            <p style="margin:0 0 8px;"><strong>Time:</strong> ${d.time || 'TBD'}</p>
            <p style="margin:0 0 8px;"><strong>Weather:</strong> ${d.weather || 'Check conditions at tmarkcharters.com'}</p>
            <p style="margin:0;"><strong>Location:</strong> Montrose Harbor. ${d.dockInstructions || 'Dock info will follow shortly.'}</p>
          </div>
          <p style="color:#4a5568;">Balance due on arrival: <strong>$${d.balance || '0'}</strong></p>
        </div>${brandFooter}`,
    },

    review_request: {
      subject: 'How was your TMarK experience?',
      html: `${brandHeader}
        <div style="padding:32px 24px;font-family:Arial,sans-serif;color:#1a202c;text-align:center;">
          <h2 style="color:#0a1628;margin:0 0 16px;">Thanks for Sailing With Us!</h2>
          <p style="color:#4a5568;line-height:1.7;max-width:400px;margin:0 auto 24px;">We hope you loved your ${d.experience || 'charter'} experience, ${d.name || ''}. Your feedback means the world to us.</p>
          <a href="${d.reviewUrl || '#'}" style="display:inline-block;padding:14px 32px;background:#d4a843;color:#0a1628;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Leave a Review</a>
          <p style="color:#a0aabb;margin-top:24px;font-size:13px;">You earned a new passport stamp! Log in to check your progress.</p>
        </div>${brandFooter}`,
    },

    passport_milestone: {
      subject: `You've reached ${d.tier || 'a new'} tier!`,
      html: `${brandHeader}
        <div style="padding:32px 24px;font-family:Arial,sans-serif;color:#1a202c;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">${d.tierIcon || '⚓'}</div>
          <h2 style="color:#d4a843;margin:0 0 8px;">Congratulations, ${d.name || 'Captain'}!</h2>
          <p style="color:#4a5568;font-size:18px;margin:0 0 24px;">You've reached <strong>${d.tier || 'Explorer'}</strong> tier with ${d.stamps || '0'} stamps.</p>
          <div style="background:#f5f7fa;border-radius:12px;padding:24px;margin:20px auto;max-width:400px;">
            <h3 style="color:#0a1628;margin:0 0 12px;">Your Reward</h3>
            <p style="color:#d4a843;font-weight:bold;font-size:16px;margin:0;">${d.reward || '10% off your next booking'}</p>
          </div>
          <a href="https://tmarkcharters.com/#passport" style="display:inline-block;padding:14px 32px;background:#d4a843;color:#0a1628;text-decoration:none;border-radius:8px;font-weight:bold;margin-top:16px;">View Your Passport</a>
        </div>${brandFooter}`,
    },
  };

  const tmpl = templates[template];
  if (!tmpl) return res.status(400).json({ error: 'Unknown template: ' + template });

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: tmpl.subject,
        html: tmpl.html,
      }),
    });
    const result = await emailRes.json();

    if (result.statusCode && result.statusCode >= 400) {
      return res.status(400).json({ error: result.message });
    }

    return res.status(200).json({ ok: true, id: result.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
