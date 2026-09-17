export const demoAdvice = { season: 'kharif', weatherSummary: { rainNext7DaysMm: 24, source: 'demo' }, recommendations: [
  { crop: 'Rice', confidence: 88, why: ['Matches the Kharif sowing calendar', 'Loamy soil retains suitable moisture', 'Rainfall outlook supports early establishment'] },
  { crop: 'Maize', confidence: 80, why: ['Suitable for loamy soil', 'Weather window is manageable with irrigation', 'Diversifies the previous wheat cycle'] },
  { crop: 'Pearl millet', confidence: 74, why: ['Resilient option for variable rainfall', 'Fits Kharif conditions', 'Lower water demand than rice'] }
], alerts: [{ severity: 'info', message: 'Demo alert: check the forecast before fertilizer application.' }] };
export const defaultProfile = { name: 'Farmer', region: 'Ludhiana, Punjab', latitude: 30.901, longitude: 75.857, soilType: 'loamy', soilMoisture: 'adequate', landSizeAcres: 2, language: 'en' };
