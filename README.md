# Smart Crop Advisory System

An Expo mobile app and API platform for small and marginal farmers, focused only on two agriculture challenges:

- **AG-01 — disease detection:** capture/upload a leaf image, classify it with an optional TensorFlow PlantVillage transfer-learning model, and return confidence-aware treatment and prevention guidance.
- **AG-02 — localized advisory:** blend seven-day weather, soil, sowing season, crop rotation, and prior disease records into 2–4 explained crop recommendations and actionable alerts.

The first demo profile targets **Ludhiana, Punjab**, with English, Hindi, and Punjabi UI support. It is deliberately designed for an honest hackathon demo: every external dependency has a working fallback.

## Architecture

```text
Expo React Native app (Expo Go / APK)
  ├─ SQLite cache for profile + last advisory (offline-first)
  └─ Express REST API
       ├─ Firebase Firestore farmer store (or in-memory demo fallback)
       ├─ OpenWeather One Call forecast (or deterministic mock fallback)
       └─ FastAPI advisory engine
            ├─ explainable rules + weighted crop ranking (sklearn-ready)
            └─ TensorFlow PlantVillage inference (when model is installed)
```

`farmerId` is the shared identity across profile, crop logs, alerts, and disease detections. The current phone/OTP endpoints are explicitly a demo stub; replace them with Firebase Auth before production.

## Repository layout

```text
mobile/             Expo React Native app and SQLite cache
backend/            Node.js + Express REST gateway and Firebase adapter
advisory-engine/    Python FastAPI scoring and TensorFlow inference service
shared/             API-contract workspace
docs/               Architecture notes
```

## Tech stack

| Layer | Technology |
| --- | --- |
| Mobile | React Native via Expo, Expo Router, Expo Image Picker, Expo SQLite |
| API | Node.js, Express, Multer, Firebase Admin |
| Advisory | Python, FastAPI, explainable weighted ranking; scikit-learn available for a future trained ranker |
| AI/ML | TensorFlow CPU inference with a PlantVillage transfer-learning export |
| Data | Firebase Firestore; device-local SQLite cache |
| External data | OpenWeather One Call; mocked soil lookup/profile values for demo |

## Run locally

Prerequisites: Node.js 20+, Python 3.10+, an Expo account only when building with EAS, and optionally Firebase/OpenWeather credentials.

1. Install and configure the Python service:

   ```powershell
   cd advisory-engine
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

2. In a second terminal, install and start the Express API:

   ```powershell
   cd backend
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```

3. In a third terminal, run the Expo client:

   ```powershell
   cd mobile
   Copy-Item .env.example .env
   # Change EXPO_PUBLIC_API_URL to http://YOUR_COMPUTER_LAN_IP:4000/api for a physical phone.
   npm install
   npx expo start
   ```

Scan the QR code using **Expo Go** on Android. Phone and computer must share the same Wi-Fi network. For a physical phone, use your LAN IP—not `localhost`—in `mobile/.env`.

### Build an installable Android APK

From `mobile/`:

```powershell
npm install
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build -p android --profile preview
```

You need an Expo account and must log in for EAS cloud builds. The included `eas.json` makes the `preview` profile generate an APK for direct installation. EAS handles Android build infrastructure; no local Android SDK is required. Before final production use, choose a unique Android package name in `mobile/app.json` and ensure the backend is reachable from the installed app.

## Configuration and secrets

Copy the provided `.env.example` files to `.env`; never commit the copies.

| Secret / setting | Where | Purpose |
| --- | --- | --- |
| `OPENWEATHER_API_KEY` | `backend/.env` | Live One Call weather forecast |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | `backend/.env` | Firebase Admin Firestore access |
| `ADVISORY_ENGINE_URL` | `backend/.env` | FastAPI service base URL |
| `EXPO_PUBLIC_API_URL` | `mobile/.env` | Reachable Express API URL |
| `MODEL_PATH` | `advisory-engine/.env` | Local `.keras` PlantVillage model export |

## What is real vs. mocked

**Working in code now**

- Expo app onboarding, advice flow, camera capture, offline SQLite cache, and leaf-analysis request flow.
- Express REST API, shared farmer record model, crop logs, alert history, disease-history persistence.
- Firebase Firestore adapter when Firebase Admin credentials are supplied.
- OpenWeather request path when an API key is supplied.
- Explainable, multi-signal crop ranking and actionable rainfall/moisture alerts.
- TensorFlow preprocessing and inference path when a compatible model exists at `MODEL_PATH`.

**Mocked or intentionally demo-safe**

- In-memory farmer store when Firebase credentials are absent.
- Deterministic Ludhiana forecast when OpenWeather credentials are absent.
- Soil moisture is collected during onboarding; an official Soil Health Card/IMD integration is not included because access requires approval.
- OTP accepts only `123456` and is not real authentication.
- No PlantVillage weights are committed. Without a team-supplied compatible model, image analysis returns an honest “No clear detection” response instead of inventing a diagnosis.
- The ranking engine is transparent rules/weighted scoring. `scikit-learn` is included to support a later small trained ranking model, but the demo does not claim a trained crop-yield model.
- Voice input/TTS is not implemented; the API contract can be extended with Google Speech-to-Text/TTS when credentials are available.

## API overview

- `PUT /api/farmers/:farmerId` — save onboarding profile
- `GET /api/farmers/:farmerId` — retrieve profile/history
- `POST /api/farmers/:farmerId/crop-logs` — add crop history
- `GET /api/weather?lat=30.901&lon=75.857` — seven-day plus hourly forecast
- `POST /api/recommendations` — explained ranked crops and alerts
- `POST /api/disease-detections` — multipart form with `farmerId` and `leaf`

## Submission-slide summary

**Problem:** Small farmers need decisions tailored to local weather, soil, cropping history, and disease risk—not a generic forecast.

**Solution:** Smart Crop Advisory combines a multilingual Expo mobile app, localized forecast data, farmer profile/history, and AI-assisted leaf scanning. It ranks crops with transparent reasons and delivers timing alerts.

**Differentiator:** Every recommendation shows its evidence—season fit, soil fit, moisture condition, forecast compatibility, rotation impact, and known disease risk—so farmers and judges can understand the decision.

**Architecture:** Expo + SQLite → Express + Firebase/OpenWeather → FastAPI scoring + TensorFlow PlantVillage inference.

**Tech stack:** Expo React Native, Node/Express, Python/FastAPI, Firebase Firestore, SQLite, TensorFlow, scikit-learn, OpenWeather.

## GitHub push

After creating a GitHub repository, run one of these from the repository root:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git branch -M main
git push -u origin main
```

Or, if GitHub CLI is authenticated:

```powershell
gh repo create smart-crop-advisory-system --private --source=. --remote=origin --push
```
