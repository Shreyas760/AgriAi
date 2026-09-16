import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { createFarmerStore } from './store.js';
import { getForecast } from './weather.js';
import { advisoryRequest } from './advisoryClient.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const store = createFarmerStore();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

// Demo-only OTP: production must use Firebase Auth / a verified SMS provider.
app.post('/api/auth/request-otp', (_req, res) => res.json({ demoOtp: '123456', message: 'Demo OTP generated' }));
app.post('/api/auth/verify-otp', (req, res) => {
  if (req.body.otp !== '123456') return res.status(401).json({ error: 'Invalid demo OTP' });
  res.json({ token: `demo-${req.body.phone || 'farmer'}`, farmerId: req.body.phone || 'demo-farmer' });
});

app.get('/api/farmers/:farmerId', async (req, res, next) => {
  try { res.json(await store.get(req.params.farmerId)); } catch (error) { next(error); }
});
app.put('/api/farmers/:farmerId', async (req, res, next) => {
  try { res.json(await store.save(req.params.farmerId, { ...req.body, farmerId: req.params.farmerId })); } catch (error) { next(error); }
});
app.post('/api/farmers/:farmerId/crop-logs', async (req, res, next) => {
  try { res.status(201).json(await store.addCropLog(req.params.farmerId, req.body)); } catch (error) { next(error); }
});

app.get('/api/weather', async (req, res, next) => {
  try { res.json(await getForecast(Number(req.query.lat), Number(req.query.lon))); } catch (error) { next(error); }
});
app.post('/api/recommendations', async (req, res, next) => {
  try {
    const farmer = await store.get(req.body.farmerId);
    const weather = await getForecast(farmer.latitude, farmer.longitude);
    const result = await advisoryRequest('/recommendations', { farmer, weather });
    await store.addAlertHistory(farmer.farmerId, result.alerts || []);
    res.json({ ...result, weatherSource: weather.source });
  } catch (error) { next(error); }
});
app.post('/api/disease-detections', upload.single('leaf'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'A leaf image is required.' });
    const result = await advisoryRequest('/detect-disease', {
      farmerId: req.body.farmerId,
      imageBase64: req.file.buffer.toString('base64'),
      mimeType: req.file.mimetype
    });
    await store.addDiseaseDetection(req.body.farmerId, result);
    res.json(result);
  } catch (error) { next(error); }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'express-api' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || 'Unexpected server error' });
});
app.listen(port, () => console.log(`Smart Crop API listening on :${port}`));
