import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const defaultFarmer = (farmerId) => ({
  farmerId, name: 'Demo Farmer', region: 'Ludhiana, Punjab', latitude: 30.901, longitude: 75.857,
  soilType: 'loamy', soilMoisture: 'adequate', landSizeAcres: 2, language: 'en',
  cropHistory: [{ crop: 'wheat', season: 'rabi', year: 2025 }], diseaseDetections: [], alertHistory: []
});

function firebaseDb() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || [
    resolve(process.cwd(), 'service-account.json'),
    ...requireServiceAccountCandidates()
  ].find(existsSync);
  if (!getApps().length) {
    if (serviceAccountPath) initializeApp({ credential: cert(JSON.parse(readFileSync(serviceAccountPath, 'utf8'))) });
    else if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) initializeApp({ credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) });
    else return null;
  }
  return getFirestore();
}

function requireServiceAccountCandidates() {
  // Avoid importing a credential filename into source; Firebase generates a unique filename per project.
  try { return readdirSync(process.cwd()).filter((file) => /firebase-adminsdk.*\.json$/i.test(file)).map((file) => resolve(process.cwd(), file)); } catch { return []; }
}

export function createFarmerStore() {
  const db = firebaseDb();
  if (!db) throw new Error('Firebase Admin credentials are missing. Add a Firebase service-account JSON in backend/.');
  async function get(id) {
    const doc = await db.collection('farmers').doc(id).get();
    return doc.exists ? doc.data() : defaultFarmer(id);
  }
  async function save(id, farmer) {
    const current = await get(id); const next = { ...current, ...farmer };
    await db.collection('farmers').doc(id).set(next);
    return next;
  }
  async function append(id, field, value) { const farmer = await get(id); return save(id, { [field]: [...(farmer[field] || []), { ...value, loggedAt: new Date().toISOString() }] }); }
  return { get, save, addCropLog: (id, log) => append(id, 'cropHistory', log), addDiseaseDetection: (id, result) => append(id, 'diseaseDetections', result), addAlertHistory: (id, alerts) => append(id, 'alertHistory', { alerts }) };
}
