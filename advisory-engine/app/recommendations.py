from datetime import datetime

CROPS = [
    {"name": "Rice", "seasons": ["kharif"], "soils": ["clayey", "loamy"], "rain": "high", "moisture": "adequate"},
    {"name": "Maize", "seasons": ["kharif", "zaid"], "soils": ["loamy", "sandy_loam"], "rain": "medium", "moisture": "moderate"},
    {"name": "Pearl millet", "seasons": ["kharif"], "soils": ["sandy", "sandy_loam", "loamy"], "rain": "low", "moisture": "low"},
    {"name": "Wheat", "seasons": ["rabi"], "soils": ["loamy", "clayey"], "rain": "low", "moisture": "moderate"},
    {"name": "Mustard", "seasons": ["rabi"], "soils": ["sandy_loam", "loamy"], "rain": "low", "moisture": "low"},
    {"name": "Moong", "seasons": ["zaid", "kharif"], "soils": ["sandy_loam", "loamy"], "rain": "medium", "moisture": "moderate"},
]

def season_for(date: datetime) -> str:
    if date.month in (6, 7, 8, 9): return "kharif"
    if date.month in (10, 11, 12, 1, 2): return "rabi"
    return "zaid"

def build_recommendations(farmer: dict, weather: dict) -> dict:
    season = season_for(datetime.now()); soil = farmer.get("soilType", "loamy").lower().replace(" ", "_")
    moisture = farmer.get("soilMoisture", "moderate").lower(); daily = weather.get("daily", [])
    rain_7d = sum(day.get("rainMm", 0) for day in daily); heavy_rain = any(day.get("rainMm", 0) >= 15 for day in daily[:4])
    past = [str(item.get("crop", "")).lower() for item in farmer.get("cropHistory", [])]
    disease_crops = " ".join(str(item.get("disease", "")).lower() for item in farmer.get("diseaseDetections", []))
    ranked = []
    for crop in CROPS:
        score, reasons = 35, []
        if season in crop["seasons"]: score += 30; reasons.append(f"matches the {season.title()} sowing calendar")
        else: reasons.append(f"is normally better suited to another season than {season.title()}")
        if soil in crop["soils"]: score += 20; reasons.append(f"your {soil.replace('_', ' ')} soil is suitable")
        if crop["moisture"] == moisture or (crop["moisture"] == "moderate" and moisture == "adequate"): score += 12; reasons.append("available soil moisture supports establishment")
        if crop["rain"] == "high" and rain_7d >= 20: score += 10; reasons.append("forecast rainfall supports its water demand")
        elif crop["rain"] == "low" and rain_7d < 20: score += 10; reasons.append("the drier forecast fits its lower water demand")
        elif crop["rain"] == "medium": score += 7; reasons.append("the upcoming weather window is manageable with irrigation planning")
        if crop["name"].lower() in past: score -= 5; reasons.append("slightly diversified to reduce repeated-crop risk")
        if crop["name"].lower() in disease_crops: score -= 12; reasons.append("lowered because prior disease records mention this crop")
        ranked.append({"crop": crop["name"], "confidence": max(35, min(95, score)), "why": reasons[:3]})
    ranked.sort(key=lambda item: item["confidence"], reverse=True)
    alerts = []
    if heavy_rain: alerts.append({"severity": "warning", "message": "Delay fertilizer application — significant rain is expected within 3 days."})
    if moisture in ("low", "dry"): alerts.append({"severity": "action", "message": "Check irrigation before sowing; recorded soil moisture is low."})
    if not alerts: alerts.append({"severity": "info", "message": "Weather is currently suitable for field preparation; check the forecast daily."})
    return {"season": season, "weatherSummary": {"rainNext7DaysMm": rain_7d, "source": weather.get("source", "mock")}, "recommendations": ranked[:4], "alerts": alerts, "explainability": "Scores combine season, soil compatibility, soil moisture, seven-day rainfall, crop rotation, and recorded disease history."}
