export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const SID = process.env.TWILIO_ACCOUNT_SID;
  const TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const FROM = process.env.TWILIO_PHONE_NUMBER;
  if (!SID || !TOKEN || !FROM) return res.status(500).json({ error: 'Twilio not configured' });

  const { to, template, data } = req.body;
  if (!to) return res.status(400).json({ error: 'Phone number required' });

  const templates = {
    booking_confirmation: (d) =>
      `TMarK Charters: Your ${d.experience} on the ${d.vessel} is confirmed for ${d.date} at ${d.time}. ${d.guests} guests. Deposit: $${d.deposit}. We'll send dock instructions 24hrs before. Questions? Reply to this text.`,

    booking_reminder: (d) =>
      `TMarK Charters: Reminder! Your ${d.experience} is tomorrow, ${d.date} at ${d.time}. Meet at Montrose Harbor, Dock ${d.dock || 'TBD'}. Parking available on Montrose Ave. Weather: ${d.weather}. See you on the water!`,

    weather_alert: (d) =>
      `TMarK Charters: Weather update for your ${d.date} booking. ${d.message} We'll contact you if rescheduling is needed. Your safety is our priority.`,

    review_request: (d) =>
      `Thanks for choosing TMarK, ${d.name}! How was your ${d.experience}? We'd love a quick review: ${d.reviewUrl}. Your next stamp is waiting!`,

    passport_update: (d) =>
      `TMarK Passport: Congrats ${d.name}! You earned your "${d.stampName}" stamp. You now have ${d.totalStamps} stamps (${d.tier} tier). ${d.reward}`,
  };

  const getMessage = templates[template];
  if (!getMessage) return res.status(400).json({ error: 'Unknown template: ' + template });

  const message = getMessage(data || {});

  try {
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${SID}:${TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: FROM, Body: message }).toString(),
      }
    );
    const result = await twilioRes.json();

    if (result.error_code) {
      return res.status(400).json({ error: result.message });
    }

    return res.status(200).json({ ok: true, sid: result.sid });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
