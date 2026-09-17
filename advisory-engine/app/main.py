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
    model_path = os.getenv("MODEL_PATH", "models/plant_disease_efficientnet.keras")
    if not os.path.exists(model_path):
        return None
    import tensorflow as tf
    return tf.keras.models.load_model(model_path)

def load_labels() -> list[str]:
    labels_path = os.getenv("MODEL_LABELS_PATH", "models/class_names.txt")
    if not os.path.exists(labels_path):
        raise FileNotFoundError(f"PlantVillage labels are missing at {labels_path}.")
    labels = []
    for line in open(labels_path, encoding="utf-8"):
        value = line.strip()
        if not value: continue
        labels.append(value.split(":", 1)[-1].strip())
    return labels

def infer_disease(image_bytes: bytes) -> dict[str, Any]:
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    except UnidentifiedImageError:
        return {"clearDetection": False, "disease": "Unreadable image", "confidence": 0, "guidance": ["Upload a clear JPG or PNG leaf photograph."]}
    model = load_model()
    if model is None:
        return {"clearDetection": False, "disease": "Model unavailable", "confidence": 0, "guidance": ["The PlantVillage TensorFlow model has not been downloaded yet.", "Run scripts/download_model.ps1, then restart the advisory engine."]}
    labels = load_labels()
    pixels = np.asarray(image, dtype=np.float32)[None, ...]
    import tensorflow as tf
    pixels = tf.keras.applications.efficientnet.preprocess_input(pixels)
    probabilities = model.predict(pixels, verbose=0)[0]
    index = int(np.argmax(probabilities)); confidence = float(probabilities[index])
    disease = labels[index] if index < len(labels) else "Unknown disease"
    if confidence < 0.65:
        return {"clearDetection": False, "disease": "No clear detection", "confidence": round(confidence * 100, 1), "guidance": ["Try a clearer close-up in daylight.", "Photograph a single affected leaf, including both sides if possible."]}
    normalized = disease.lower().replace("_", " ")
    if "healthy" in normalized: guidance = ["No disease pattern was detected by the model.", "Continue weekly scouting and avoid watering foliage late in the day."]
    elif "blight" in normalized: guidance = ["Remove severely affected leaves and do not compost them.", "Avoid wet foliage; ask a local agriculture officer about crop-approved treatment."]
    elif "spot" in normalized or "scab" in normalized: guidance = ["Remove affected debris and disinfect tools between plants.", "Avoid handling plants while leaves are wet and monitor neighbouring plants."]
    else: guidance = ["Isolate affected plants where practical and monitor spread.", "Confirm treatment choices with a local agriculture officer before applying chemicals."]
    return {"clearDetection": True, "disease": disease.replace("___", " — ").replace("_", " ").title(), "confidence": round(confidence * 100, 1), "guidance": guidance}

@app.get("/health")
def health(): return {"status": "ok", "service": "fastapi-advisory-engine"}

@app.post("/recommendations")
def recommendations(request: RecommendationRequest): return build_recommendations(request.farmer, request.weather)

@app.post("/detect-disease")
def detect_disease(request: DetectionRequest):
    result = infer_disease(base64.b64decode(request.imageBase64))
    return {**result, "farmerId": request.farmerId, "analysedAt": datetime.utcnow().isoformat() + "Z"}
