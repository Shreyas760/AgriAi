export async function advisoryRequest(path, body) {
  const baseUrl = process.env.ADVISORY_ENGINE_URL || 'http://127.0.0.1:8000';
  const response = await fetch(`${baseUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Advisory engine error: ${await response.text()}`);
  return response.json();
}
