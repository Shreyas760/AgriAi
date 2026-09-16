import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const memory = new Map();
const defaultFarmer = (farmerId) => ({
  farmerId, name: 'Demo Farmer', region: 'Ludhiana, Punjab', latitude: 30.901, longitude: 75.857,
  soilType: 'loamy', soilMoisture: 'adequate', landSizeAcres: 2, language: 'en',
  cropHistory: [{ crop: 'wheat', season: 'rabi', year: 2025 }], diseaseDetections: [], alertHistory: []
});

function firebaseDb() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) return null;
  if (!getApps().length) initializeApp({ credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) });
  return getFirestore();
}

export function createFarmerStore() {
  const db = firebaseDb();
  async function get(id) {
    if (!db) { if (!memory.has(id)) memory.set(id, defaultFarmer(id)); return memory.get(id); }
    const doc = await db.collection('farmers').doc(id).get();
    return doc.exists ? doc.data() : defaultFarmer(id);
  }
  async function save(id, farmer) {
    const current = await get(id); const next = { ...current, ...farmer };
    if (db) await db.collection('farmers').doc(id).set(next); else memory.set(id, next);
    return next;
  }
  async function append(id, field, value) { const farmer = await get(id); return save(id, { [field]: [...(farmer[field] || []), { ...value, loggedAt: new Date().toISOString() }] }); }
  return { get, save, addCropLog: (id, log) => append(id, 'cropHistory', log), addDiseaseDetection: (id, result) => append(id, 'diseaseDetections', result), addAlertHistory: (id, alerts) => append(id, 'alertHistory', { alerts }) };
}
