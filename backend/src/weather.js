const fallback = {
  source: 'mock', location: 'Ludhiana, Punjab', current: { tempC: 29, humidity: 58 },
  hourly: [{ hoursFromNow: 3, rainProbability: 10 }, { hoursFromNow: 24, rainProbability: 20 }, { hoursFromNow: 72, rainProbability: 78 }],
  daily: Array.from({ length: 7 }, (_, index) => ({ day: index + 1, tempMinC: 22 + (index % 2), tempMaxC: 31 + (index % 3), rainMm: index === 2 ? 18 : index === 3 ? 9 : 1 }))
};
export async function getForecast(lat = 30.901, lon = 75.857) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return fallback;
  const response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${key}`);
  if (!response.ok) return fallback;
  const data = await response.json();
  return { source: 'openweather', current: { tempC: data.current.temp, humidity: data.current.humidity }, hourly: data.hourly.slice(0, 24).map((item, i) => ({ hoursFromNow: i, rainProbability: Math.round((item.pop || 0) * 100) })), daily: data.daily.slice(0, 7).map((item, i) => ({ day: i + 1, tempMinC: item.temp.min, tempMaxC: item.temp.max, rainMm: item.rain || 0 })) };
}
