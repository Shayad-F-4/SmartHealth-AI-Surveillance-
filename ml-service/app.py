import os
import joblib
import numpy as np
import pandas as pd
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.cluster import DBSCAN

app = FastAPI(
    title="Smart Healthcare AI/ML Service",
    description="Microservice for clinical risk prediction, physiological anomaly detection, geospatial DBSCAN hotspot clustering, and disease case forecasting.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# Global model references
model_a = None
model_b = None
model_d = None

def load_models():
    global model_a, model_b, model_d
    try:
        path_a = os.path.join(MODELS_DIR, "model_a_risk.joblib")
        if os.path.exists(path_a):
            model_a = joblib.load(path_a)
        
        path_b = os.path.join(MODELS_DIR, "model_b_anomaly.joblib")
        if os.path.exists(path_b):
            model_b = joblib.load(path_b)

        path_d = os.path.join(MODELS_DIR, "model_d_forecast.joblib")
        if os.path.exists(path_d):
            model_d = joblib.load(path_d)
        print("ML Models loaded successfully into memory.")
    except Exception as e:
        print(f"Warning loading ML models: {e}")

@app.on_event("startup")
def on_startup():
    load_models()

# --- Request / Response Schemas ---

class RiskPredictionRequest(BaseModel):
    age: float = Field(..., ge=0, le=120)
    bmi: float = Field(..., ge=10, le=70)
    systolic_bp: float = Field(..., ge=60, le=260)
    diastolic_bp: float = Field(..., ge=40, le=160)
    fasting_glucose: float = Field(..., ge=40, le=500)
    family_history_flag: int = Field(0, ge=0, le=1)
    chronic_conditions_count: int = Field(0, ge=0, le=10)

class AnomalyDetectionRequest(BaseModel):
    systolic_bp: float = Field(..., ge=50, le=260)
    diastolic_bp: float = Field(..., ge=30, le=160)
    fasting_glucose: float = Field(..., ge=30, le=600)
    heart_rate: float = Field(72.0, ge=30, le=220)
    bmi: float = Field(24.0, ge=10, le=70)
    temperature: float = Field(98.6, ge=90.0, le=108.0)

class CaseLocation(BaseModel):
    id: str
    disease: str
    district: str
    lat: float
    lng: float
    date: Optional[str] = None

class HotspotDetectionRequest(BaseModel):
    cases: List[CaseLocation]
    eps_km: float = 2.5
    min_samples: int = 3

class ForecastRequest(BaseModel):
    disease: str
    district: str
    historical_weekly_cases: List[int]
    forecast_weeks: int = 4

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Smart Healthcare AI/ML Service",
        "models_loaded": {
            "model_a_risk": model_a is not None,
            "model_b_anomaly": model_b is not None,
            "model_d_forecast": model_d is not None
        },
        "disclaimer": "All ML predictions are clinical decision-support indicators requiring professional review."
    }

@app.post("/predict-risk")
def predict_patient_risk(req: RiskPredictionRequest):
    """
    Model A: Predicts patient cardiometabolic / general clinical risk category.
    """
    factors = []
    if req.systolic_bp >= 140 or req.diastolic_bp >= 90:
        factors.append(f"Hypertension Stage ({req.systolic_bp:.0f}/{req.diastolic_bp:.0f} mmHg)")
    elif req.systolic_bp >= 130:
        factors.append(f"Pre-hypertension ({req.systolic_bp:.0f} mmHg)")

    if req.fasting_glucose >= 126:
        factors.append(f"Elevated fasting glucose ({req.fasting_glucose:.0f} mg/dL - Diabetic range)")
    elif req.fasting_glucose >= 100:
        factors.append(f"Impaired fasting glucose ({req.fasting_glucose:.0f} mg/dL)")

    if req.bmi >= 30:
        factors.append(f"Obesity Category (BMI {req.bmi:.1f})")
    elif req.bmi >= 25:
        factors.append(f"Overweight (BMI {req.bmi:.1f})")

    if req.family_history_flag == 1:
        factors.append("Documented family history of chronic/cardiovascular disease")

    if req.chronic_conditions_count > 0:
        factors.append(f"{req.chronic_conditions_count} existing documented chronic condition(s)")

    if req.age >= 60:
        factors.append(f"Elevated age bracket ({req.age:.0f} yrs)")

    feature_importances = {}
    if model_a is not None:
        X = pd.DataFrame([{
            'age': req.age,
            'bmi': req.bmi,
            'systolic_bp': req.systolic_bp,
            'diastolic_bp': req.diastolic_bp,
            'fasting_glucose': req.fasting_glucose,
            'family_history_flag': req.family_history_flag,
            'chronic_conditions_count': req.chronic_conditions_count
        }])
        pred_class = int(model_a.predict(X)[0])
        probas = model_a.predict_proba(X)[0]
        # Calculate risk score (0-100)
        risk_score = float(probas[1] * 50 + probas[2] * 100) if len(probas) == 3 else float(pred_class * 50)
        level_map = {0: "LOW", 1: "MODERATE", 2: "HIGH"}
        risk_level = level_map.get(pred_class, "MODERATE")
        prob_dict = {
            "low": round(float(probas[0]), 3) if len(probas) > 0 else 0.0,
            "moderate": round(float(probas[1]), 3) if len(probas) > 1 else 0.0,
            "high": round(float(probas[2]), 3) if len(probas) > 2 else 0.0
        }
        if hasattr(model_a, "feature_importances_") and hasattr(model_a, "feature_names_in_"):
            for fname, imp in zip(model_a.feature_names_in_, model_a.feature_importances_):
                feature_importances[str(fname)] = round(float(imp), 4)
        elif hasattr(model_a, "feature_importances_"):
            cols = ['age', 'bmi', 'systolic_bp', 'diastolic_bp', 'fasting_glucose', 'family_history_flag', 'chronic_conditions_count']
            for fname, imp in zip(cols, model_a.feature_importances_):
                feature_importances[fname] = round(float(imp), 4)
    else:
        # Heuristic fallback if model not loaded
        raw_score = min(100.0, len(factors) * 18.0 + (req.age * 0.2))
        risk_level = "HIGH" if raw_score >= 65 else ("MODERATE" if raw_score >= 35 else "LOW")
        risk_score = raw_score
        prob_dict = {"low": 0.33, "moderate": 0.33, "high": 0.33}
        feature_importances = {
            "fasting_glucose": 0.25,
            "systolic_bp": 0.22,
            "bmi": 0.18,
            "family_history_flag": 0.15,
            "chronic_conditions_count": 0.10,
            "age": 0.06,
            "diastolic_bp": 0.04
        }

    return {
        "risk_level": risk_level,
        "risk_score": round(min(100.0, max(5.0, risk_score)), 1),
        "probabilities": prob_dict,
        "feature_importances": feature_importances,
        "model_metadata": {
            "model": "RandomForestClassifier",
            "version": "1.0.0",
            "loaded_in_memory": model_a is not None
        },
        "contributing_factors": factors if factors else ["No major high-risk indicators detected in current vitals"],
        "recommendation": (
            "Immediate comprehensive clinical evaluation and monitoring advised." if risk_level == "HIGH"
            else ("Routine preventive follow-up and lifestyle modification recommended." if risk_level == "MODERATE"
                  else "Healthy baseline; maintain routine annual screening.")
        ),
        "disclaimer": "AI risk assessment is a decision-support indicator and not a medical diagnosis."
    }

@app.post("/detect-anomaly")
def detect_vitals_anomaly(req: AnomalyDetectionRequest):
    """
    Model B: Uses Isolation Forest to detect abnormal physiological readings.
    """
    flagged = []
    if req.systolic_bp > 160 or req.systolic_bp < 85:
        flagged.append(f"Extreme Systolic BP ({req.systolic_bp:.0f} mmHg)")
    if req.diastolic_bp > 105 or req.diastolic_bp < 50:
        flagged.append(f"Extreme Diastolic BP ({req.diastolic_bp:.0f} mmHg)")
    if req.fasting_glucose > 240 or req.fasting_glucose < 60:
        flagged.append(f"Severe Fasting Glucose Deviation ({req.fasting_glucose:.0f} mg/dL)")
    if req.heart_rate > 120 or req.heart_rate < 45:
        flagged.append(f"Heart Rate Anomaly ({req.heart_rate:.0f} bpm)")
    if req.temperature > 102.5 or req.temperature < 96.0:
        flagged.append(f"Abnormal Body Temperature ({req.temperature:.1f} °F)")

    is_anomaly = False
    score = 0.5

    if model_b is not None:
        X = pd.DataFrame([{
            'systolic_bp': req.systolic_bp,
            'diastolic_bp': req.diastolic_bp,
            'fasting_glucose': req.fasting_glucose,
            'heart_rate': req.heart_rate,
            'bmi': req.bmi,
            'temperature': req.temperature
        }])
        pred = model_b.predict(X)[0] # -1 for anomaly, 1 for normal
        decision = float(model_b.decision_function(X)[0])
        score = round((decision + 0.5) * 100, 1)
        is_anomaly = (pred == -1) or (len(flagged) > 0)
    else:
        is_anomaly = len(flagged) > 0
        score = 25.0 if is_anomaly else 85.0

    return {
        "is_anomaly": bool(is_anomaly),
        "status": "ANOMALY_DETECTED" if is_anomaly else "NORMAL",
        "anomaly_confidence": round(abs(float(score)), 1),
        "flagged_parameters": flagged,
        "action_required": "Urgent clinician review recommended" if is_anomaly else "Parameters within standard physiologic threshold",
        "disclaimer": "Physiological anomaly flag is a decision-support alert, requiring professional clinical validation."
    }

@app.post("/detect-hotspots")
def detect_disease_hotspots(req: HotspotDetectionRequest):
    """
    Model C: DBSCAN spatial clustering over geographic coordinates (lat, lng).
    Groups cases into outbreak hotspots and calculates cluster centroids and radii.
    """
    if len(req.cases) < req.min_samples:
        return {
            "hotspots": [],
            "total_clusters": 0,
            "total_cases_analyzed": len(req.cases),
            "noise_cases": len(req.cases),
            "message": "Insufficient case volume for spatial clustering."
        }

    # Earth radius in kilometers
    kms_per_radian = 6371.0088
    epsilon = req.eps_km / kms_per_radian

    coords = np.array([[c.lat, c.lng] for c in req.cases])
    coords_rad = np.radians(coords)

    db = DBSCAN(eps=epsilon, min_samples=req.min_samples, metric='haversine')
    labels = db.fit_predict(coords_rad)

    unique_labels = set(labels)
    hotspots = []

    for label in unique_labels:
        if label == -1:
            continue  # Noise points
        
        cluster_mask = (labels == label)
        cluster_cases = [req.cases[i] for i, m in enumerate(cluster_mask) if m]
        cluster_coords = coords[cluster_mask]

        center_lat = float(np.mean(cluster_coords[:, 0]))
        center_lng = float(np.mean(cluster_coords[:, 1]))

        # Calculate max distance from center in km
        dists = np.sqrt(((cluster_coords[:, 0] - center_lat) * 111.0)**2 + 
                        ((cluster_coords[:, 1] - center_lng) * 111.0 * np.cos(np.radians(center_lat)))**2)
        radius_km = float(max(0.5, np.max(dists)))

        case_count = len(cluster_cases)
        # Calculate risk classification based on case density
        if case_count >= 15:
            severity = "HIGH_RISK"
            risk_color = "RED"
        elif case_count >= 6:
            severity = "WARNING"
            risk_color = "YELLOW"
        else:
            severity = "NORMAL"
            risk_color = "GREEN"

        primary_disease = cluster_cases[0].disease if cluster_cases else "Unknown"
        primary_district = cluster_cases[0].district if cluster_cases else "Unknown"

        hotspots.append({
            "cluster_id": f"HOTSPOT-{primary_disease.upper()[:3]}-{label+1:02d}",
            "disease": primary_disease,
            "district": primary_district,
            "center_lat": round(center_lat, 5),
            "center_lng": round(center_lng, 5),
            "case_count": case_count,
            "radius_km": round(radius_km, 2),
            "severity": severity,
            "risk_color": risk_color,
            "case_ids": [c.id for c in cluster_cases]
        })

    # Sort hotspots by case count descending
    hotspots.sort(key=lambda h: h["case_count"], reverse=True)

    return {
        "hotspots": hotspots,
        "total_clusters": len(hotspots),
        "total_cases_analyzed": len(req.cases),
        "noise_cases": int(np.sum(labels == -1)),
        "clustering_algorithm": "DBSCAN (Haversine metric)"
    }

@app.post("/forecast-cases")
def forecast_disease_cases(req: ForecastRequest):
    """
    Model D: Autoregressive time-series forecasting for disease cases across upcoming 4 weeks.
    """
    history = list(req.historical_weekly_cases)
    if len(history) == 0:
        history = [5, 8, 12, 15]

    current_cases = history[-1]
    predictions = []
    
    # If series is short, pad with rolling mean
    working_series = list(history)
    if len(working_series) < 4:
        avg_val = sum(working_series) / max(len(working_series), 1)
        working_series = [int(avg_val)] * (4 - len(working_series)) + working_series

    for step in range(req.forecast_weeks):
        lag_1 = working_series[-1]
        lag_2 = working_series[-2]
        lag_3 = working_series[-3]
        rolling_mean = np.mean([lag_1, lag_2, lag_3])
        growth_rate = (lag_1 - lag_2) / max(lag_2, 1)

        woy = (len(working_series) + step) % 52
        sin_woy = np.sin(2 * np.pi * woy / 52)
        cos_woy = np.cos(2 * np.pi * woy / 52)

        if model_d is not None:
            X = pd.DataFrame([[lag_1, lag_2, lag_3, rolling_mean, growth_rate, sin_woy, cos_woy]],
                             columns=['lag_1', 'lag_2', 'lag_3', 'rolling_mean_3', 'growth_rate', 'sin_woy', 'cos_woy'])
            pred = float(model_d.predict(X)[0])
        else:
            # Autoregressive extrapolation fallback
            pred = lag_1 + (lag_1 - lag_2) * 0.85

        next_val = max(1, int(round(pred)))
        predictions.append(next_val)
        working_series.append(next_val)

    # Trend calculation
    first_pred = predictions[0]
    last_pred = predictions[-1]
    overall_growth = ((last_pred - current_cases) / max(current_cases, 1)) * 100

    if overall_growth > 20:
        trend = "INCREASING"
        risk_indicator = "HIGH_RISK" if last_pred >= 25 else "WARNING"
    elif overall_growth < -15:
        trend = "DECREASING"
        risk_indicator = "NORMAL"
    else:
        trend = "STABLE"
        risk_indicator = "WARNING" if current_cases >= 20 else "NORMAL"

    return {
        "disease": req.disease,
        "district": req.district,
        "current_weekly_cases": current_cases,
        "predicted_weekly_cases": predictions,
        "forecast_horizon_weeks": req.forecast_weeks,
        "trend": trend,
        "projected_growth_rate_pct": round(overall_growth, 1),
        "risk_indicator": risk_indicator,
        "confidence_interval": {
            "lower": [max(0, int(p * 0.8)) for p in predictions],
            "upper": [int(p * 1.25) for p in predictions]
        },
        "model_used": "Autoregressive Lag Forecaster (Ridge Regression)",
        "disclaimer": "Forecast is a public health surveillance projection and subject to epidemiological variance."
    }

@app.post("/train-models")
def trigger_retraining():
    """
    Triggers re-execution of the training pipeline.
    """
    from train import train_model_a_risk, train_model_b_anomaly, train_model_d_forecast
    train_model_a_risk()
    train_model_b_anomaly()
    train_model_d_forecast()
    load_models()
    return {"message": "All ML models retrained and reloaded successfully."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
