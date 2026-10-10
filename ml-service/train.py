import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, IsolationForest, VotingClassifier
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error, r2_score

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_model_a_risk():
    """
    Model A: Patient Risk Prediction (Advanced Gradient Boosting & Random Forest Ensemble)
    Features: [age, bmi, systolic_bp, diastolic_bp, fasting_glucose, family_history_flag, chronic_conditions_count]
    Target: 0 = Low Risk, 1 = Moderate Risk, 2 = High Risk
    """
    print("--- Training Model A: Patient Risk Prediction (Ensemble ML) ---")
    np.random.seed(42)
    n_samples = 6000

    age = np.random.uniform(18, 85, n_samples)
    bmi = np.random.uniform(18.5, 42.0, n_samples)
    systolic_bp = np.random.uniform(95, 185, n_samples)
    diastolic_bp = systolic_bp * 0.6 + np.random.normal(0, 5, n_samples)
    fasting_glucose = np.random.uniform(70, 240, n_samples)
    family_history = np.random.choice([0, 1], size=n_samples, p=[0.6, 0.4])
    chronic_conditions = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.5, 0.3, 0.15, 0.05])

    # Clinically grounded multi-factorial risk scoring
    risk_score = (
        (age > 55).astype(int) * 18 +
        (bmi > 28).astype(int) * 14 +
        (bmi > 32).astype(int) * 16 +
        (systolic_bp > 130).astype(int) * 16 +
        (systolic_bp > 145).astype(int) * 22 +
        (diastolic_bp > 90).astype(int) * 14 +
        (fasting_glucose > 110).astype(int) * 16 +
        (fasting_glucose > 140).astype(int) * 26 +
        family_history * 22 +
        chronic_conditions * 22 +
        np.random.normal(0, 6, n_samples)
    )

    # Classify into 0 (Low: < 35), 1 (Moderate: 35-70), 2 (High: > 70)
    labels = np.zeros(n_samples, dtype=int)
    labels[risk_score >= 35] = 1
    labels[risk_score >= 70] = 2

    X = pd.DataFrame({
        'age': age,
        'bmi': bmi,
        'systolic_bp': systolic_bp,
        'diastolic_bp': diastolic_bp,
        'fasting_glucose': fasting_glucose,
        'family_history_flag': family_history,
        'chronic_conditions_count': chronic_conditions
    })
    y = labels

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Build ensemble model: Random Forest + Gradient Boosting
    rf = RandomForestClassifier(n_estimators=150, max_depth=10, min_samples_split=4, random_state=42)
    gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, max_depth=6, random_state=42)

    ensemble_clf = VotingClassifier(
        estimators=[('rf', rf), ('gb', gb)],
        voting='soft'
    )
    ensemble_clf.fit(X_train, y_train)

    # Cross-validation score
    cv_scores = cross_val_score(ensemble_clf, X_train, y_train, cv=5)
    print(f"Model A 5-Fold Cross-Validation Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

    preds = ensemble_clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"Model A Test Accuracy: {acc:.4f}")
    print(classification_report(y_test, preds, target_names=["Low Risk", "Moderate Risk", "High Risk"]))

    model_path = os.path.join(MODELS_DIR, "model_a_risk.joblib")
    joblib.dump(ensemble_clf, model_path)
    print(f"Saved Model A Ensemble to {model_path}\n")
    return ensemble_clf

def train_model_b_anomaly():
    """
    Model B: Physiological Anomaly & Decompensation Detector (Isolation Forest)
    Features: [systolic_bp, diastolic_bp, fasting_glucose, heart_rate, bmi, temperature]
    Detects severe vitals outliers, hypertensive crisis, & fever spikes.
    """
    print("--- Training Model B: Health Anomaly Detection (Isolation Forest) ---")
    np.random.seed(42)
    n_samples = 5000

    # Normal physiologic vitals distribution
    systolic_bp = np.random.normal(120, 9, n_samples)
    diastolic_bp = np.random.normal(80, 6, n_samples)
    fasting_glucose = np.random.normal(95, 10, n_samples)
    heart_rate = np.random.normal(72, 7, n_samples)
    bmi = np.random.normal(24.5, 3.0, n_samples)
    temperature = np.random.normal(98.6, 0.35, n_samples)

    # Inject ~5.5% intentional clinical anomalies
    n_anomalies = int(n_samples * 0.055)
    anomaly_indices = np.random.choice(n_samples, n_anomalies, replace=False)
    split_size = n_anomalies // 3

    systolic_bp[anomaly_indices[:split_size]] += np.random.uniform(55, 85, split_size)
    fasting_glucose[anomaly_indices[split_size:2*split_size]] += np.random.uniform(95, 190, split_size)
    temperature[anomaly_indices[2*split_size:]] += np.random.uniform(3.2, 5.5, len(anomaly_indices) - 2*split_size)

    X = pd.DataFrame({
        'systolic_bp': systolic_bp,
        'diastolic_bp': diastolic_bp,
        'fasting_glucose': fasting_glucose,
        'heart_rate': heart_rate,
        'bmi': bmi,
        'temperature': temperature
    })

    iso = IsolationForest(n_estimators=150, contamination=0.055, random_state=42)
    iso.fit(X)

    model_path = os.path.join(MODELS_DIR, "model_b_anomaly.joblib")
    joblib.dump(iso, model_path)
    print(f"Saved Model B to {model_path}\n")
    return iso

def train_model_d_forecast():
    """
    Model D: Epidemic Disease Forecasting (Autoregressive Ridge & Gradient Boosting)
    Predicts next-period case counts using historical lag features & seasonal sin/cos encodings.
    """
    print("--- Training Model D: Disease Case Forecasting (Autoregressive ML) ---")
    np.random.seed(42)
    weeks = 200

    # Generate realistic seasonal epidemic waves with random localized outbreaks
    t = np.arange(weeks)
    base_trend = 15 + 10 * np.sin(2 * np.pi * t / 52) + 0.05 * t
    outbreaks = np.zeros(weeks)
    outbreaks[30:45] += np.hanning(15) * 50
    outbreaks[95:115] += np.hanning(20) * 75
    outbreaks[160:180] += np.hanning(20) * 60
    noise = np.random.poisson(lam=3, size=weeks)

    series = np.maximum(1, np.round(base_trend + outbreaks + noise))

    # Feature extraction for time series forecasting
    data = []
    for i in range(3, weeks):
        lag_1 = series[i - 1]
        lag_2 = series[i - 2]
        lag_3 = series[i - 3]
        rolling_mean = np.mean([lag_1, lag_2, lag_3])
        growth_rate = (lag_1 - lag_2) / max(lag_2, 1)
        woy = i % 52
        sin_woy = np.sin(2 * np.pi * woy / 52)
        cos_woy = np.cos(2 * np.pi * woy / 52)
        target = series[i]
        data.append([lag_1, lag_2, lag_3, rolling_mean, growth_rate, sin_woy, cos_woy, target])

    df = pd.DataFrame(data, columns=['lag_1', 'lag_2', 'lag_3', 'rolling_mean_3', 'growth_rate', 'sin_woy', 'cos_woy', 'target'])
    X = df.drop(columns=['target'])
    y = df['target']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    forecaster = Ridge(alpha=1.5)
    forecaster.fit(X_train, y_train)

    preds = forecaster.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    print(f"Model D Forecast RMSE: {rmse:.2f} cases | R² Score: {r2:.4f}")

    model_path = os.path.join(MODELS_DIR, "model_d_forecast.joblib")
    joblib.dump(forecaster, model_path)
    print(f"Saved Model D to {model_path}\n")
    return forecaster

if __name__ == "__main__":
    print("Starting ML Model Training Pipeline...")
    train_model_a_risk()
    train_model_b_anomaly()
    train_model_d_forecast()
    print("All ML models successfully trained and serialized.")
