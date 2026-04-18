// /api/customer-intel.js
// Customer Intelligence Agent - Powered by Claude Opus 4.7
// Given a customer identifier, generates an actionable briefing
// for crew before a charter: VIP status, history, preferences, upsell signals.

const MODEL = "claude-opus-4-7";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Simple admin gate so only Ops Hub can call this
  const adminKey = req.headers['x-admin-key'] || (req.body && req.body.adminKey);
  if (adminKey !== (process.env.ADMIN_KEY || 'tmark2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI not configured',
      hint: 'Add ANTHROPIC_API_KEY to Vercel environment variables'
    });
  }

  const { email, phone, name, upcomingBooking } = req.body || {};
  if (!email && !phone && !name) {
    return res.status(400).json({ error: 'Provide email, phone, or name' });
  }

  try {
    // 1. Pull customer history from KV / admin store
    const customer = await lookupCustomer({ email, phone, name });

    // 2. Build the briefing with Claude Opus 4.7
    const briefing = await generateBriefing(customer, upcomingBooking, apiKey);

    return res.status(200).json({
      customer,
      briefing,
      generatedAt: new Date().toISOString(),
      model: MODEL
    });
  } catch (err) {
    console.error('customer-intel error:', err);
    return res.status(500).json({ error: 'Failed to generate briefing', detail: err.message });
  }
}

// ---------------------------------------------------------------------------
// Customer lookup - pulls from Vercel KV if configured, falls back to sample.
// ---------------------------------------------------------------------------
async function lookupCustomer({ email, phone, name }) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  // Try KV first
  if (kvUrl && kvToken) {
    const key = email ? `customer:${email.toLowerCase()}` : phone ? `customer:${phone}` : `customer:${name}`;
    const r = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    if (r.ok) {
      const { result } = await r.json();
      if (result) return typeof result === 'string' ? JSON.parse(result) : result;
    }

    // Also try to find bookings for this customer
    const bookingsR = await fetch(`${kvUrl}/keys/booking:*`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    if (bookingsR.ok) {
      const { result: keys } = await bookingsR.json();
      const matchingBookings = [];
      for (const k of (keys || [])) {
        const br = await fetch(`${kvUrl}/get/${encodeURIComponent(k)}`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        if (br.ok) {
          const { result: bData } = await br.json();
          const booking = typeof bData === 'string' ? JSON.parse(bData) : bData;
          if (booking && (
            (email && booking.email && booking.email.toLowerCase() === email.toLowerCase()) ||
            (phone && booking.phone === phone) ||
            (name && booking.name && booking.name.toLowerCase().includes(name.toLowerCase()))
          )) {
            matchingBookings.push(booking);
          }
        }
      }
      if (matchingBookings.length > 0) {
        return buildCustomerFromBookings(matchingBookings, { email, phone, name });
      }
    }
  }

  // Fallback: sample data for demo
  return getSampleCustomer({ email, phone, name });
}

function buildCustomerFromBookings(bookings, ident) {
  const sorted = bookings.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const totalRevenue = bookings.reduce((s, b) => s + (b.total || b.amount || 0), 0);
  const tier = totalRevenue >= 5000 ? 'Admiral'
             : totalRevenue >= 2500 ? 'Captain'
             : totalRevenue >= 1000 ? 'Navigator'
             : 'Explorer';
  return {
    name: sorted[0].name || ident.name || 'Guest',
    email: sorted[0].email || ident.email || '',
    phone: sorted[0].phone || ident.phone || '',
    bookings: sorted.length,
    totalRevenue,
    tier,
    lastBooking: sorted[0].date || null,
    history: sorted.slice(0, 10).map(b => ({
      date: b.date,
      experience: b.experience || b.pkg || 'Charter',
      guests: b.guests,
      vessel: b.vessel,
      total: b.total || b.amount,
      notes: b.notes
    })),
    preferences: extractPreferences(bookings),
    notes: sorted[0].notes || ''
  };
}

function extractPreferences(bookings) {
  const experiences = {};
  const times = {};
  const vessels = {};
  bookings.forEach(b => {
    if (b.experience) experiences[b.experience] = (experiences[b.experience] || 0) + 1;
    if (b.time) times[b.time] = (times[b.time] || 0) + 1;
    if (b.vessel) vessels[b.vessel] = (vessels[b.vessel] || 0) + 1;
  });
  const topOf = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0];
  return {
    favoriteExperience: topOf(experiences),
    preferredTime: topOf(times),
    preferredVessel: topOf(vessels)
  };
}

function getSampleCustomer({ email, phone, name }) {
  // Demo data when KV not configured
  const samples = {
    'jen@email.com': {
      name: 'Jennifer Martinez', email: 'jen@email.com', phone: '(312) 555-0201',
      bookings: 3, totalRevenue: 2685, tier: 'Navigator',
      lastBooking: '2026-03-15',
      history: [
        { date: '2026-03-15', experience: 'Sunset Escape', guests: 4, vessel: 'Ndinda', total: 495, notes: 'Birthday for friend' },
        { date: '2025-08-20', experience: 'Date Night', guests: 2, vessel: 'Ndinda', total: 795, notes: 'Anniversary' },
        { date: '2025-06-14', experience: 'Sunset Escape', guests: 4, vessel: 'Ndinda', total: 495, notes: '' }
      ],
      preferences: { favoriteExperience: 'Sunset Escape', preferredTime: 'sunset', preferredVessel: 'Ndinda' },
      notes: 'Prefers sunset cruises, birthday in July, often brings champagne'
    },
    'maria@email.com': {
      name: 'Maria Rodriguez', email: 'maria@email.com', phone: '(312) 555-0605',
      bookings: 7, totalRevenue: 6100, tier: 'Admiral',
      lastBooking: '2026-03-18',
      history: [
        { date: '2026-03-18', experience: 'Corporate Chill', guests: 6, vessel: 'Ndinda', total: 1200, notes: 'Team offsite' },
        { date: '2026-02-14', experience: 'Date Night', guests: 2, vessel: 'Ndinda', total: 795, notes: '' },
        { date: '2025-07-04', experience: 'Fireworks Front Row', guests: 6, vessel: 'Ndinda', total: 1253, notes: 'Annual tradition' }
      ],
      preferences: { favoriteExperience: 'Corporate Chill', preferredTime: 'evening', preferredVessel: 'Ndinda' },
      notes: 'VIP. Referred 3 customers. Always tips generously. Allergic to shellfish.'
    }
  };
  const key = (email || '').toLowerCase();
  return samples[key] || {
    name: name || 'New Guest',
    email: email || '',
    phone: phone || '',
    bookings: 0, totalRevenue: 0, tier: 'Explorer',
    lastBooking: null, history: [],
    preferences: {}, notes: 'First-time guest. No history on file.'
  };
}

// ---------------------------------------------------------------------------
// Generate briefing with Claude Opus 4.7
// ---------------------------------------------------------------------------
async function generateBriefing(customer, upcoming, apiKey) {
  const prompt = buildPrompt(customer, upcoming);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: `You are TMarK's Customer Intelligence Agent. You brief the captain and crew before a charter so they can deliver an exceptional, personalized experience.

TMarK is a premium Chicago waterfront charter company. The fleet: TMarK (24ft RIB), Ndinda (29ft Crownline), Emily Faye (29ft sailboat, overnight), Rita (jet ski). Founders are Captain Kip and Tiffany. Crew includes William (skipper), Taneka and Domingo (partners), Malombe (deckhand), Marley (dog).

Customer tiers: Explorer ($0-999), Navigator ($1000-2499), Captain ($2500-4999), Admiral ($5000+).

Keep briefings scannable and actionable. No fluff. Focus on what the crew actually needs to know and do.`,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  return parseStructuredBriefing(text);
}

function buildPrompt(customer, upcoming) {
  const historyText = (customer.history || []).map((h, i) =>
    `${i + 1}. ${h.date || '?'} - ${h.experience} (${h.guests || '?'} guests, ${h.vessel || '?'}) - $${h.total || 0}${h.notes ? ' - "' + h.notes + '"' : ''}`
  ).join('\n') || '(No prior bookings)';

  const upcomingText = upcoming ? `
UPCOMING CHARTER:
- Experience: ${upcoming.experience || upcoming.pkg || 'TBD'}
- Date: ${upcoming.date || 'TBD'}
- Time: ${upcoming.time || 'TBD'}
- Guests: ${upcoming.guests || 'TBD'}
- Special requests: ${upcoming.notes || '(none)'}` : '';

  return `Generate a crew briefing for this customer.

CUSTOMER:
- Name: ${customer.name}
- Tier: ${customer.tier} (${customer.bookings} bookings, $${customer.totalRevenue} lifetime)
- Last booking: ${customer.lastBooking || 'never'}
- Notes on file: ${customer.notes || '(none)'}
- Preferences: favorite experience = ${customer.preferences?.favoriteExperience || 'unknown'}, preferred time = ${customer.preferences?.preferredTime || 'unknown'}, preferred vessel = ${customer.preferences?.preferredVessel || 'unknown'}

BOOKING HISTORY:
${historyText}
${upcomingText}

Return a JSON object with exactly these fields:
{
  "vipStatus": "VIP" | "Regular" | "First-time" | "At-risk",
  "headline": "one-sentence summary the captain reads first",
  "keyInsights": ["2-4 short bullets of what the crew should know"],
  "personalTouches": ["2-4 specific, actionable things to do during the charter"],
  "upsellOpportunities": ["1-3 tactful upsell ideas based on their pattern, or empty array"],
  "risksOrNotes": ["1-2 things to watch out for, allergies, past issues, or empty array"],
  "tone": "how to greet and interact with them (one short sentence)"
}

Return ONLY the JSON, no markdown, no preamble.`;
}

function parseStructuredBriefing(text) {
  try {
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    return {
      vipStatus: 'Unknown',
      headline: text.split('\n')[0] || 'Briefing generated.',
      keyInsights: [text],
      personalTouches: [],
      upsellOpportunities: [],
      risksOrNotes: [],
      tone: 'Standard warm welcome.',
      raw: text
    };
  }
}
