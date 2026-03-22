// TMarK Smart Pricing Engine
// Adjusts pricing based on: weekday/weekend, peak season, holidays, weather, demand, last-minute, empty slots

const VESSELS = {
  tmark: { name: 'TMarK RIB', base: 225, minHours: 2, maxGuests: 6, type: 'rib' },
  ndinda: { name: 'Ndinda', base: 275, minHours: 3, maxGuests: 6, type: 'cruiser' },
  emily_faye: { name: 'Emily Faye', baseSail: 175, baseOvernight: 275, baseWeekend: 325, baseWeek: 250, minHours: 2, maxGuests: 4, type: 'sailboat' },
  rita: { name: 'Rita', base30: 95, base60: 175, maxGuests: 1, type: 'jetski' },
};

const PACKAGES = [
  { id: 'sunset_escape', name: 'Sunset Escape', vessel: ['tmark','ndinda'], hours: 2, basePrice: 495, desc: 'Golden hour cruise along the Chicago skyline', includes: ['Captain & crew','Fuel','Safety gear','Sunset timing guarantee'], for: 'Couples & small groups', icon: '🌅', popular: true },
  { id: 'date_night', name: 'Date Night on the Water', vessel: ['ndinda','emily_faye'], hours: 3, basePrice: 795, desc: 'Romantic evening cruise with underwater LED lights', includes: ['Captain & crew','Fuel','LED night lighting','Bluetooth speaker','Cozy blankets'], for: 'Couples', icon: '💫' },
  { id: 'birthday_cruise', name: 'Birthday Cruise', vessel: ['ndinda'], hours: 3, basePrice: 895, desc: 'Celebrate with a private cruise and lake views', includes: ['Captain & crew','Fuel','Decor setup','Bluetooth speaker','Photo spots'], for: 'Birthday groups up to 6', icon: '🎂' },
  { id: 'celebration_charter', name: 'Celebration Charter', vessel: ['ndinda','tmark'], hours: 4, basePrice: 1150, desc: 'Proposals, anniversaries, milestones on the water', includes: ['Captain & crew','Fuel','Premium setup','Champagne toast setup area','Photography-ready deck'], for: 'Special occasions', icon: '🥂' },
  { id: 'turnup_cruise', name: 'Turn-Up Cruise', vessel: ['ndinda','tmark'], hours: 3, basePrice: 895, desc: 'High-energy party cruise with premium sound', includes: ['Captain & crew','Fuel','Premium speaker','Lake toys','Playpen anchoring'], for: 'Friend groups up to 6', icon: '🎵', popular: true },
  { id: 'corporate_chill', name: 'Corporate Chill Session', vessel: ['ndinda'], hours: 4, basePrice: 1200, desc: 'Team building and executive outings on Lake Michigan', includes: ['Captain & crew','Fuel','Cabin comfort','Professional atmosphere','Flexible itinerary'], for: 'Corporate teams up to 6', icon: '💼' },
  { id: 'skyline_rush', name: 'Skyline Rush', vessel: ['tmark'], hours: 1, basePrice: 275, desc: 'High-speed RIB blast along the Chicago waterfront', includes: ['Captain','Fuel','Safety gear','Skyline photo ops'], for: 'Thrill-seekers', icon: '⚡' },
  { id: 'overnight_escape', name: 'Harbor Overnight', vessel: ['emily_faye'], hours: null, basePrice: 295, priceType: 'per_night', desc: 'Sleep under the stars aboard our classic sailboat', includes: ['Clean linens','Welcome briefing','Harbor access','Morning coffee setup area'], for: 'Couples (2-4 guests)', icon: '🌙' },
  { id: 'weekend_getaway', name: 'Weekend on the Lake', vessel: ['emily_faye'], hours: null, basePrice: 550, priceType: 'per_weekend', desc: 'Two nights aboard the Emily Faye', includes: ['Clean linens','Welcome briefing','Harbor access','Sunset sail option','Morning coffee setup area'], for: 'Couples', icon: '⛵' },
  { id: 'fireworks_special', name: 'Fireworks Front Row', vessel: ['ndinda','tmark'], hours: 3, basePrice: 895, desc: 'Best fireworks viewing in Chicago, from the water', includes: ['Captain & crew','Fuel','Prime anchoring spot','Night cruise','LED lighting (Ndinda)'], for: 'Groups up to 6', icon: '🎆', seasonal: true },
];

const ADDONS = [
  { id: 'jetski', name: 'Jet Ski Add-On (Rita)', price: 95, unit: '30 min', desc: 'Add a guided jet ski ride' },
  { id: 'jetski_hr', name: 'Jet Ski Add-On (Rita)', price: 175, unit: '1 hr', desc: 'Extended jet ski experience' },
  { id: 'lake_toys', name: 'Lake Toys Package', price: 50, unit: 'per trip', desc: 'Floats, water mats, and fun gear' },
  { id: 'decor', name: 'Decor Package', price: 75, unit: 'per trip', desc: 'Balloons, banner, and themed setup' },
  { id: 'premium_decor', name: 'Premium Decor', price: 150, unit: 'per trip', desc: 'Full floral, lighting, and luxury setup' },
  { id: 'cooler', name: 'Cooler & Ice Package', price: 25, unit: 'per trip', desc: 'Large cooler with ice for your BYO drinks' },
  { id: 'photo', name: 'Photography Session', price: 200, unit: '1 hr', desc: 'Professional photographer on board' },
  { id: 'speaker_upgrade', name: 'Premium Speaker', price: 40, unit: 'per trip', desc: 'JBL PartyBox upgrade' },
  { id: 'blankets', name: 'Cozy Blanket Set', price: 20, unit: 'per trip', desc: 'Soft blankets for evening cruises' },
];

// Chicago events that trigger peak pricing
const PEAK_EVENTS_2026 = [
  { name: 'Memorial Day Weekend', start: '2026-05-23', end: '2026-05-25', multiplier: 1.3 },
  { name: 'July 4th Week', start: '2026-06-30', end: '2026-07-05', multiplier: 1.4 },
  { name: 'Air & Water Show', start: '2026-08-15', end: '2026-08-16', multiplier: 1.5 },
  { name: 'Labor Day Weekend', start: '2026-09-05', end: '2026-09-07', multiplier: 1.3 },
  { name: 'Taste of Chicago', start: '2026-07-08', end: '2026-07-12', multiplier: 1.2 },
  { name: 'Lollapalooza Weekend', start: '2026-07-30', end: '2026-08-02', multiplier: 1.25 },
];

function calculatePrice(params) {
  const { vessel, packageId, date, hours, addons = [], override = null } = params;

  // Admin override takes priority
  if (override !== null && override !== undefined) {
    return { total: override, breakdown: [{ label: 'Custom Price', amount: override }], multipliers: [] };
  }

  const d = new Date(date + 'T12:00:00-05:00');
  const dayOfWeek = d.getDay();
  const month = d.getMonth();
  const now = new Date();
  const daysUntil = Math.floor((d - now) / (1000 * 60 * 60 * 24));

  let basePrice = 0;
  let breakdown = [];
  let multipliers = [];

  // Get base price from package or hourly
  if (packageId) {
    const pkg = PACKAGES.find(p => p.id === packageId);
    if (pkg) {
      basePrice = pkg.basePrice;
      breakdown.push({ label: pkg.name + ' Package', amount: basePrice });
    }
  } else {
    const v = VESSELS[vessel];
    if (v) {
      const h = Math.max(hours || v.minHours, v.minHours);
      basePrice = v.base * h;
      breakdown.push({ label: v.name + ' (' + h + 'hr)', amount: basePrice });
    }
  }

  if (basePrice === 0) return { total: 0, breakdown, multipliers, error: 'Invalid vessel or package' };

  let adjustedPrice = basePrice;

  // Weekend premium
  if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5) {
    const weekendPremium = dayOfWeek === 5 ? 0.1 : 0.15; // Friday 10%, Sat/Sun 15%
    const weekendAmount = Math.round(basePrice * weekendPremium);
    adjustedPrice += weekendAmount;
    multipliers.push({ label: 'Weekend', pct: Math.round(weekendPremium * 100) + '%', amount: weekendAmount });
  }

  // Peak season (June-Aug)
  if (month >= 5 && month <= 7) {
    const seasonPct = 0.1;
    const seasonAmount = Math.round(basePrice * seasonPct);
    adjustedPrice += seasonAmount;
    multipliers.push({ label: 'Peak Season', pct: '10%', amount: seasonAmount });
  }

  // Event-based pricing
  const dateStr = date;
  const event = PEAK_EVENTS_2026.find(e => dateStr >= e.start && dateStr <= e.end);
  if (event) {
    const eventPct = event.multiplier - 1;
    const eventAmount = Math.round(basePrice * eventPct);
    adjustedPrice += eventAmount;
    multipliers.push({ label: event.name, pct: Math.round(eventPct * 100) + '%', amount: eventAmount });
  }

  // Last-minute premium (within 48 hours)
  if (daysUntil <= 2 && daysUntil >= 0) {
    const lastMinPct = 0.15;
    const lastMinAmount = Math.round(basePrice * lastMinPct);
    adjustedPrice += lastMinAmount;
    multipliers.push({ label: 'Same-day/Last-minute', pct: '15%', amount: lastMinAmount });
  }

  // Empty slot discount (more than 14 days out, weekday)
  if (daysUntil > 14 && dayOfWeek >= 1 && dayOfWeek <= 4) {
    const earlyPct = -0.1;
    const earlyAmount = Math.round(basePrice * earlyPct);
    adjustedPrice += earlyAmount;
    multipliers.push({ label: 'Early Weekday Discount', pct: '-10%', amount: earlyAmount });
  }

  // Add-ons
  let addonTotal = 0;
  const addonBreakdown = [];
  (addons || []).forEach(addonId => {
    const addon = ADDONS.find(a => a.id === addonId);
    if (addon) {
      addonTotal += addon.price;
      addonBreakdown.push({ label: addon.name, amount: addon.price });
    }
  });

  const subtotal = Math.round(adjustedPrice);
  const total = subtotal + addonTotal;
  const deposit = Math.round(total * 0.5);

  return {
    basePrice,
    subtotal,
    addonTotal,
    total,
    deposit,
    balance: total - deposit,
    breakdown: [...breakdown, ...addonBreakdown],
    multipliers,
    savings: multipliers.filter(m => m.amount < 0).reduce((s, m) => s + Math.abs(m.amount), 0),
    surcharges: multipliers.filter(m => m.amount > 0).reduce((s, m) => s + m.amount, 0),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // Return packages, vessels, and addons catalog
    return res.status(200).json({
      vessels: VESSELS,
      packages: PACKAGES,
      addons: ADDONS,
      peakEvents: PEAK_EVENTS_2026,
    });
  }

  if (req.method === 'POST') {
    const result = calculatePrice(req.body);
    return res.status(200).json(result);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
