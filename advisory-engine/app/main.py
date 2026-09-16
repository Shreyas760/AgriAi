import base64
import io
import os
from datetime import datetime
from typing import Any

import numpy as np
from fastapi import FastAPI
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

from .recommendations import build_recommendations

app = FastAPI(title="Smart Crop Advisory Engine", version="1.0.0")

class RecommendationRequest(BaseModel):
    farmer: dict[str, Any]
    weather: dict[str, Any]

class DetectionRequest(BaseModel):
    farmerId: str
    imageBase64: str
    mimeType: str = "image/jpeg"

def load_model():
    """Loads an exported PlantVillage transfer-learning model when supplied by the team."""
    model_path = os.getenv("MODEL_PATH", "models/plant_disease_model.keras")
    if not os.path.exists(model_path):
        return None
    import tensorflow as tf
    return tf.keras.models.load_model(model_path)

def infer_disease(image_bytes: bytes) -> dict[str, Any]:
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    except UnidentifiedImageError:
        return {"clearDetection": False, "disease": "Unreadable image", "confidence": 0, "guidance": ["Upload a clear JPG or PNG leaf photograph."]}
    model = load_model()
    if model is None:
        # Honest no-model fallback: never claim a diagnosis from an untrained heuristic.
        return {"clearDetection": False, "disease": "No clear detection", "confidence": 0, "guidance": ["PlantVillage model is not installed for this demo.", "Take a close, well-lit photo of one leaf against a plain background."]}
    labels = ["healthy", "bacterial_spot", "early_blight", "late_blight", "leaf_mold"]
    pixels = np.asarray(image, dtype=np.float32)[None, ...] / 255.0
    probabilities = model.predict(pixels, verbose=0)[0]
    index = int(np.argmax(probabilities)); confidence = float(probabilities[index])
    disease = labels[index] if index < len(labels) else "Unknown disease"
    if confidence < 0.65:
        return {"clearDetection": False, "disease": "No clear detection", "confidence": round(confidence * 100, 1), "guidance": ["Try a clearer close-up in daylight.", "Photograph a single affected leaf, including both sides if possible."]}
    guidance = {
        "healthy": ["No disease pattern detected.", "Continue weekly scouting and avoid overhead irrigation late in the day."],
        "early_blight": ["Remove heavily affected leaves.", "Avoid wet foliage and consult local extension guidance for an approved fungicide."],
        "late_blight": ["Isolate affected plants and contact an agriculture extension officer promptly.", "Avoid moving tools from affected to healthy plots."],
        "bacterial_spot": ["Remove affected plant debris.", "Use clean tools and avoid handling plants while foliage is wet."],
        "leaf_mold": ["Improve airflow and reduce humidity around plants.", "Remove severely affected leaves and monitor adjacent plants."]
    }
    return {"clearDetection": True, "disease": disease.replace("_", " ").title(), "confidence": round(confidence * 100, 1), "guidance": guidance.get(disease, ["Consult a local agriculture officer before treatment."])}

@app.get("/health")
def health(): return {"status": "ok", "service": "fastapi-advisory-engine"}

@app.post("/recommendations")
def recommendations(request: RecommendationRequest): return build_recommendations(request.farmer, request.weather)

@app.post("/detect-disease")
def detect_disease(request: DetectionRequest):
    result = infer_disease(base64.b64decode(request.imageBase64))
    return {**result, "farmerId": request.farmerId, "analysedAt": datetime.utcnow().isoformat() + "Z"}
