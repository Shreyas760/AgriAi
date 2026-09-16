const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api';
export const farmerId = 'demo-farmer';
async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Network request failed');
  return response.json();
}
export const api = {
  profile: () => request(`/farmers/${farmerId}`),
  saveProfile: (profile: object) => request(`/farmers/${farmerId}`, { method: 'PUT', body: JSON.stringify(profile) }),
  recommendations: () => request('/recommendations', { method: 'POST', body: JSON.stringify({ farmerId }) }),
  detect: async (uri: string) => { const body = new FormData(); body.append('farmerId', farmerId); body.append('leaf', { uri, name: 'leaf.jpg', type: 'image/jpeg' } as never); const response = await fetch(`${API_URL}/disease-detections`, { method: 'POST', body }); if (!response.ok) throw new Error('Could not analyse image'); return response.json(); }
};
