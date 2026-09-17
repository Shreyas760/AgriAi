export async function getForecast(lat = 30.901, lon = 75.857) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key || key === 'your-openweather-api-key') throw Object.assign(new Error('OPENWEATHER_API_KEY is not configured.'), { status: 503 });
  const response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${key}`);
  if (response.ok) {
    const data = await response.json();
    return { source: 'openweather-onecall', current: { tempC: data.current.temp, humidity: data.current.humidity }, hourly: data.hourly.slice(0, 24).map((item, i) => ({ hoursFromNow: i, rainProbability: Math.round((item.pop || 0) * 100) })), daily: data.daily.slice(0, 7).map((item, i) => ({ day: i + 1, tempMinC: item.temp.min, tempMaxC: item.temp.max, rainMm: item.rain || 0 })) };
  }
  // Many free OpenWeather accounts do not include One Call. This remains live OpenWeather data, normalized from its 5-day forecast endpoint.
  const fiveDay = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`);
  if (!fiveDay.ok) throw Object.assign(new Error(`OpenWeather request failed (${fiveDay.status}). Check the key and API subscription.`), { status: 502 });
  const data = await fiveDay.json(); const buckets = new Map();
  for (const item of data.list) { const day = item.dt_txt.slice(0, 10); const current = buckets.get(day) || { temperatures: [], rainMm: 0, pops: [] }; current.temperatures.push(item.main.temp); current.rainMm += item.rain?.['3h'] || 0; current.pops.push(item.pop || 0); buckets.set(day, current); }
  return { source: 'openweather-5day', current: { tempC: data.list[0].main.temp, humidity: data.list[0].main.humidity }, hourly: data.list.slice(0, 24).map((item, i) => ({ hoursFromNow: i * 3, rainProbability: Math.round((item.pop || 0) * 100) })), daily: [...buckets.values()].map((day, i) => ({ day: i + 1, tempMinC: Math.min(...day.temperatures), tempMaxC: Math.max(...day.temperatures), rainMm: Math.round(day.rainMm * 10) / 10 })) };
}
