import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export interface RiskPredictionPayload {
  age: number;
  bmi: number;
  systolic_bp: number;
  diastolic_bp: number;
  fasting_glucose: number;
  family_history_flag: number;
  chronic_conditions_count: number;
}

export interface AnomalyPayload {
  systolic_bp: number;
  diastolic_bp: number;
  fasting_glucose: number;
  heart_rate: number;
  bmi: number;
  temperature: number;
}

export async function predictRiskWithML(payload: RiskPredictionPayload) {
  try {
    const res = await axios.post(`${ML_SERVICE_URL}/predict-risk`, payload, { timeout: 4000 });
    return res.data;
  } catch (err: any) {
    console.warn('[ML Client] ML Service unavailable, using internal fallback for risk prediction.');
    // Robust clinical fallback
    let score = 20;
    const factors: string[] = [];

    if (payload.systolic_bp >= 140 || payload.diastolic_bp >= 90) {
      score += 25;
      factors.push(`Hypertension (${payload.systolic_bp}/${payload.diastolic_bp} mmHg)`);
    }
    if (payload.fasting_glucose >= 126) {
      score += 25;
      factors.push(`Elevated Fasting Glucose (${payload.fasting_glucose} mg/dL)`);
    }
    if (payload.bmi >= 30) {
      score += 20;
      factors.push(`Obesity (BMI ${payload.bmi.toFixed(1)})`);
    }
    if (payload.family_history_flag) {
      score += 15;
      factors.push('Significant family disease pattern');
    }
    if (payload.chronic_conditions_count > 0) {
      score += payload.chronic_conditions_count * 10;
      factors.push(`${payload.chronic_conditions_count} chronic condition(s)`);
    }

    const clampedScore = Math.min(100, Math.max(10, score));
    const level = clampedScore >= 65 ? 'HIGH' : (clampedScore >= 35 ? 'MODERATE' : 'LOW');

    return {
      risk_level: level,
      risk_score: clampedScore,
      probabilities: { low: level === 'LOW' ? 0.7 : 0.15, moderate: level === 'MODERATE' ? 0.6 : 0.25, high: level === 'HIGH' ? 0.75 : 0.1 },
      contributing_factors: factors.length > 0 ? factors : ['No major high-risk physiological indicators'],
      recommendation: level === 'HIGH' ? 'Immediate comprehensive clinical review recommended.' : 'Routine preventive monitoring.',
      disclaimer: 'Clinical decision-support indicator only. Not a medical diagnosis.',
    };
  }
}

export async function detectAnomalyWithML(payload: AnomalyPayload) {
  try {
    const res = await axios.post(`${ML_SERVICE_URL}/detect-anomaly`, payload, { timeout: 4000 });
    return res.data;
  } catch (err: any) {
    console.warn('[ML Client] ML Service unavailable, using internal fallback for anomaly detection.');
    const flagged: string[] = [];
    if (payload.systolic_bp > 160 || payload.systolic_bp < 85) flagged.push(`Extreme Systolic BP (${payload.systolic_bp} mmHg)`);
    if (payload.diastolic_bp > 100 || payload.diastolic_bp < 50) flagged.push(`Extreme Diastolic BP (${payload.diastolic_bp} mmHg)`);
    if (payload.fasting_glucose > 250 || payload.fasting_glucose < 65) flagged.push(`Severe Fasting Glucose Deviation (${payload.fasting_glucose} mg/dL)`);
    if (payload.heart_rate > 125 || payload.heart_rate < 45) flagged.push(`Severe Heart Rate Anomaly (${payload.heart_rate} bpm)`);
    if (payload.temperature > 103.0 || payload.temperature < 96.0) flagged.push(`High Fever / Hypothermia (${payload.temperature} °F)`);

    const isAnomaly = flagged.length > 0;
    return {
      is_anomaly: isAnomaly,
      status: isAnomaly ? 'ANOMALY_DETECTED' : 'NORMAL',
      anomaly_confidence: isAnomaly ? 90.0 : 85.0,
      flagged_parameters: flagged,
      action_required: isAnomaly ? 'Urgent clinician review recommended' : 'Parameters within standard physiologic threshold',
      disclaimer: 'Physiological anomaly flag is a decision-support alert, requiring professional clinical validation.',
    };
  }
}

export async function detectHotspotsWithML(cases: any[], epsKm = 2.5, minSamples = 3) {
  try {
    const res = await axios.post(`${ML_SERVICE_URL}/detect-hotspots`, { cases, eps_km: epsKm, min_samples: minSamples }, { timeout: 5000 });
    return res.data;
  } catch (err: any) {
    console.warn('[ML Client] ML Hotspot Service unavailable, using fallback grid clustering.');
    // Fallback simple district-based grouping
    const districtGroups: Record<string, any[]> = {};
    cases.forEach((c) => {
      districtGroups[c.district] = districtGroups[c.district] || [];
      districtGroups[c.district].push(c);
    });

    const hotspots: any[] = [];
    Object.entries(districtGroups).forEach(([dist, dCases], idx) => {
      if (dCases.length >= minSamples) {
        const lats = dCases.map((c) => c.lat);
        const lngs = dCases.map((c) => c.lng);
        const centerLat = lats.reduce((a, b) => a + b, 0) / dCases.length;
        const centerLng = lngs.reduce((a, b) => a + b, 0) / dCases.length;
        hotspots.push({
          cluster_id: `HOTSPOT-${dist.substring(0, 3).toUpperCase()}-${idx + 1}`,
          disease: dCases[0]?.disease || 'General',
          district: dist,
          center_lat: centerLat,
          center_lng: centerLng,
          case_count: dCases.length,
          radius_km: 2.0,
          severity: dCases.length >= 15 ? 'HIGH_RISK' : (dCases.length >= 6 ? 'WARNING' : 'NORMAL'),
          risk_color: dCases.length >= 15 ? 'RED' : (dCases.length >= 6 ? 'YELLOW' : 'GREEN'),
          case_ids: dCases.map((c) => c.id),
        });
      }
    });

    return {
      hotspots,
      total_clusters: hotspots.length,
      total_cases_analyzed: cases.length,
      noise_cases: 0,
      clustering_algorithm: 'District-Density Fallback',
    };
  }
}

export async function forecastCasesWithML(disease: string, district: string, historicalCases: number[], weeks = 4) {
  try {
    const res = await axios.post(`${ML_SERVICE_URL}/forecast-cases`, {
      disease,
      district,
      historical_weekly_cases: historicalCases,
      forecast_weeks: weeks,
    }, { timeout: 4000 });
    return res.data;
  } catch (err: any) {
    console.warn('[ML Client] ML Forecast Service unavailable, using fallback autoregression.');
    const last = historicalCases[historicalCases.length - 1] || 10;
    const prev = historicalCases[historicalCases.length - 2] || last;
    const growth = (last - prev) / Math.max(prev, 1);
    const predicted: number[] = [];
    let cur = last;

    for (let i = 0; i < weeks; i++) {
      cur = Math.max(1, Math.round(cur * (1 + growth * 0.7)));
      predicted.push(cur);
    }

    const overallPct = ((predicted[predicted.length - 1] - last) / Math.max(last, 1)) * 100;

    return {
      disease,
      district,
      current_weekly_cases: last,
      predicted_weekly_cases: predicted,
      forecast_horizon_weeks: weeks,
      trend: overallPct > 15 ? 'INCREASING' : (overallPct < -10 ? 'DECREASING' : 'STABLE'),
      projected_growth_rate_pct: Math.round(overallPct),
      risk_indicator: predicted[predicted.length - 1] >= 25 ? 'HIGH_RISK' : (predicted[predicted.length - 1] >= 10 ? 'WARNING' : 'NORMAL'),
      model_used: 'Autoregressive Fallback Projection',
      disclaimer: 'Forecast is a public health surveillance projection and subject to epidemiological variance.',
    };
  }
}
