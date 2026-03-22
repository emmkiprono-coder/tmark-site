// Admin API - CRUD for bookings, pricing overrides, blackouts, promotions
// Uses Vercel KV for persistence

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Simple auth check
  const ADMIN_KEY = process.env.ADMIN_KEY || 'tmark2026';
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${ADMIN_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  const kvFetch = async (cmd) => {
    if (!KV_URL || !KV_TOKEN) return { result: null };
    const r = await fetch(KV_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    });
    return r.json();
  };

  const getStore = async (key) => {
    const r = await kvFetch(['GET', key]);
    return r.result ? JSON.parse(r.result) : [];
  };
  const setStore = async (key, data) => {
    await kvFetch(['SET', key, JSON.stringify(data)]);
  };

  const { resource } = req.query; // ?resource=bookings|overrides|blackouts|promos|leads

  try {
    if (req.method === 'GET') {
      if (resource === 'dashboard') {
        // Return everything for the admin dashboard
        const [bookings, overrides, blackouts, promos, leads] = await Promise.all([
          getStore('tmark-bookings'),
          getStore('tmark-overrides'),
          getStore('tmark-blackouts'),
          getStore('tmark-promos'),
          getStore('tmark-leads'),
        ]);

        // Calculate stats
        const now = new Date();
        const thisMonth = bookings.filter(b => new Date(b.date) >= new Date(now.getFullYear(), now.getMonth(), 1));
        const revenue = thisMonth.reduce((s, b) => s + (b.total || 0), 0);
        const avgValue = thisMonth.length ? Math.round(revenue / thisMonth.length) : 0;

        return res.status(200).json({
          bookings,
          overrides,
          blackouts,
          promos,
          leads,
          stats: {
            totalBookings: bookings.length,
            monthBookings: thisMonth.length,
            monthRevenue: revenue,
            avgBookingValue: avgValue,
            pendingLeads: leads.filter(l => l.status === 'new').length,
            upcomingBookings: bookings.filter(b => new Date(b.date) >= now).length,
            vesselUtilization: {
              tmark: bookings.filter(b => b.vessel === 'tmark' && new Date(b.date) >= new Date(now.getFullYear(), now.getMonth(), 1)).length,
              ndinda: bookings.filter(b => b.vessel === 'ndinda' && new Date(b.date) >= new Date(now.getFullYear(), now.getMonth(), 1)).length,
              emily_faye: bookings.filter(b => b.vessel === 'emily_faye' && new Date(b.date) >= new Date(now.getFullYear(), now.getMonth(), 1)).length,
              rita: bookings.filter(b => b.vessel === 'rita' && new Date(b.date) >= new Date(now.getFullYear(), now.getMonth(), 1)).length,
            },
          },
        });
      }
      const data = await getStore(`tmark-${resource}`);
      return res.status(200).json({ data });
    }

    if (req.method === 'POST') {
      const item = { ...req.body, id: 'item_' + Date.now(), createdAt: new Date().toISOString() };
      const data = await getStore(`tmark-${resource}`);
      data.unshift(item);
      await setStore(`tmark-${resource}`, data);
      return res.status(201).json({ ok: true, item });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      let data = await getStore(`tmark-${resource}`);
      data = data.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d);
      await setStore(`tmark-${resource}`, data);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      let data = await getStore(`tmark-${resource}`);
      data = data.filter(d => d.id !== id);
      await setStore(`tmark-${resource}`, data);
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
