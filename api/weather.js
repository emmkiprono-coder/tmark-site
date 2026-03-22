export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    // Chicago/Lake Michigan marine zone - NOAA point for Montrose Harbor area
    const pointRes = await fetch('https://api.weather.gov/points/41.9639,-87.6371', {
      headers: { 'User-Agent': 'TMarK Charters (info@tmarkcharters.com)' }
    });
    const pointData = await pointRes.json();
    const forecastUrl = pointData.properties?.forecast;
    const hourlyUrl = pointData.properties?.forecastHourly;

    // Get current conditions
    const stationRes = await fetch('https://api.weather.gov/stations/KORD/observations/latest', {
      headers: { 'User-Agent': 'TMarK Charters (info@tmarkcharters.com)' }
    });
    const stationData = await stationRes.json();
    const current = stationData.properties || {};

    // Get forecast
    const forecastRes = await fetch(forecastUrl, {
      headers: { 'User-Agent': 'TMarK Charters (info@tmarkcharters.com)' }
    });
    const forecastData = await forecastRes.json();
    const periods = forecastData.properties?.periods || [];

    // Get marine/lake conditions from Great Lakes forecast
    let marineConditions = null;
    try {
      const marineRes = await fetch('https://api.weather.gov/zones/forecast/LMZ740/forecast', {
        headers: { 'User-Agent': 'TMarK Charters (info@tmarkcharters.com)' }
      });
      const marineData = await marineRes.json();
      marineConditions = marineData.properties?.periods?.[0] || null;
    } catch {}

    // Build response
    const tempF = current.temperature?.value
      ? Math.round(current.temperature.value * 9/5 + 32)
      : null;
    const windMph = current.windSpeed?.value
      ? Math.round(current.windSpeed.value * 0.621371)
      : null;
    const windDir = current.windDirection?.value
      ? getWindDirection(current.windDirection.value)
      : '';

    const result = {
      current: {
        tempF,
        description: current.textDescription || '',
        windMph,
        windDirection: windDir,
        humidity: current.relativeHumidity?.value ? Math.round(current.relativeHumidity.value) : null,
        visibility: current.visibility?.value ? Math.round(current.visibility.value / 1609) : null,
      },
      marine: marineConditions ? {
        summary: marineConditions.detailedForecast || '',
        name: marineConditions.name || '',
      } : null,
      forecast: periods.slice(0, 6).map(p => ({
        name: p.name,
        tempF: p.temperature,
        wind: p.windSpeed,
        windDir: p.windDirection,
        short: p.shortForecast,
        detail: p.detailedForecast,
        isDaytime: p.isDaytime,
      })),
      charterAdvice: getCharterAdvice(tempF, windMph, current.textDescription || ''),
      updatedAt: new Date().toISOString(),
    };

    // Cache for 15 minutes
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function getWindDirection(degrees) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

function getCharterAdvice(tempF, windMph, description) {
  const lower = description.toLowerCase();
  if (lower.includes('thunderstorm') || lower.includes('severe'))
    return { status: 'unsafe', message: 'Severe weather. Charters will be rescheduled.', color: '#c0392b' };
  if (windMph && windMph > 25)
    return { status: 'caution', message: 'High winds on the lake. Contact us for conditions.', color: '#d4740e' };
  if (lower.includes('rain') || lower.includes('storm'))
    return { status: 'caution', message: 'Rain expected. Ndinda cabin cruiser recommended for covered comfort.', color: '#d4740e' };
  if (windMph && windMph > 15)
    return { status: 'good', message: 'Breezy conditions. Great for sailing on the Emily Faye!', color: '#2e7d5b' };
  if (tempF && tempF >= 70 && windMph && windMph < 10)
    return { status: 'perfect', message: 'Perfect conditions! Ideal for any charter or dock-stay.', color: '#c8913a' };
  return { status: 'good', message: 'Good conditions for chartering today.', color: '#2e7d5b' };
}
