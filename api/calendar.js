export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'Google Calendar not configured' });

  // Calendar IDs per vessel - set these in env vars
  const calendars = {
    tmark: process.env.GCAL_TMARK || '',
    ndinda: process.env.GCAL_NDINDA || '',
    emily_faye: process.env.GCAL_EMILY_FAYE || '',
    rita: process.env.GCAL_RITA || '',
  };

  try {
    if (req.method === 'GET') {
      // Check availability for a date range
      const { vessel, date } = req.query;
      const calId = calendars[vessel];
      if (!calId) return res.status(400).json({ error: 'Unknown vessel: ' + vessel });

      const startOfDay = new Date(date + 'T00:00:00-05:00').toISOString();
      const endOfDay = new Date(date + 'T23:59:59-05:00').toISOString();

      const gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?` +
        `timeMin=${startOfDay}&timeMax=${endOfDay}&singleEvents=true&orderBy=startTime&key=${API_KEY}`
      );
      const gcalData = await gcalRes.json();

      const bookedSlots = (gcalData.items || []).map(event => ({
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        summary: event.summary || 'Booked',
      }));

      // Determine available windows (8am-9pm operating hours)
      const available = getAvailableSlots(bookedSlots, date);

      return res.status(200).json({
        vessel,
        date,
        booked: bookedSlots.length,
        available,
        fullyBooked: available.length === 0,
      });
    }

    if (req.method === 'POST') {
      // This would create a calendar event (requires OAuth, not just API key)
      // For now, return instructions
      return res.status(200).json({
        message: 'Calendar event creation requires OAuth setup. For now, bookings are managed manually or through Google Calendar directly.',
        nextStep: 'Set up Google OAuth to enable automatic calendar event creation.'
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function getAvailableSlots(bookedSlots, date) {
  const openHour = 8;
  const closeHour = 21;
  const slotDuration = 60; // minutes
  const available = [];

  for (let hour = openHour; hour < closeHour; hour++) {
    const slotStart = new Date(`${date}T${String(hour).padStart(2,'0')}:00:00-05:00`);
    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

    const isBooked = bookedSlots.some(b => {
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      return slotStart < bEnd && slotEnd > bStart;
    });

    if (!isBooked) {
      available.push({
        start: `${hour}:00`,
        end: `${hour + 1}:00`,
        display: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
      });
    }
  }
  return available;
}
