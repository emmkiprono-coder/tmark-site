export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_KEY) return res.status(500).json({ error: 'Stripe not configured' });

  const { action, booking } = req.body;

  const stripeFetch = async (endpoint, body) => {
    const r = await fetch(`https://api.stripe.com/v1${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
    });
    return r.json();
  };

  try {
    if (action === 'create_deposit') {
      // Create a Stripe Checkout session for 50% deposit
      const { vessel, hours, rate, guestName, guestEmail, date, experience } = booking;
      const totalCents = Math.round(rate * hours * 100);
      const depositCents = Math.round(totalCents * 0.5);

      const session = await stripeFetch('/checkout/sessions', {
        'mode': 'payment',
        'success_url': `${req.headers.origin || 'https://tmark-website.vercel.app'}/?booking=success`,
        'cancel_url': `${req.headers.origin || 'https://tmark-website.vercel.app'}/?booking=cancelled`,
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': `TMarK ${vessel} - ${experience}`,
        'line_items[0][price_data][product_data][description]': `${date} | ${hours}hr | 50% deposit (balance due day-of)`,
        'line_items[0][price_data][unit_amount]': depositCents.toString(),
        'line_items[0][quantity]': '1',
        'customer_email': guestEmail,
        'metadata[vessel]': vessel,
        'metadata[date]': date,
        'metadata[hours]': hours.toString(),
        'metadata[guest_name]': guestName,
        'metadata[experience]': experience,
        'metadata[total_cents]': totalCents.toString(),
        'metadata[deposit_cents]': depositCents.toString(),
      });

      return res.status(200).json({ url: session.url, sessionId: session.id });
    }

    if (action === 'create_payment_link') {
      // Create a reusable payment link for a specific vessel/rate
      const { vessel, rate, description } = booking;
      const amountCents = Math.round(rate * 100);

      const price = await stripeFetch('/prices', {
        'currency': 'usd',
        'unit_amount': amountCents.toString(),
        'product_data[name]': `TMarK ${vessel} Charter`,
        'product_data[description]': description,
      });

      const link = await stripeFetch('/payment_links', {
        'line_items[0][price]': price.id,
        'line_items[0][adjustable_quantity][enabled]': 'true',
        'line_items[0][adjustable_quantity][minimum]': '1',
        'line_items[0][adjustable_quantity][maximum]': '10',
      });

      return res.status(200).json({ url: link.url });
    }

    return res.status(400).json({ error: 'Unknown action. Use create_deposit or create_payment_link' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
