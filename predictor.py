"""
Cardiovascular Risk Predictor Backend
Matches training pipeline exactly:
  - age (days) -> age_years, bmi, pulse_pressure engineered
  - RobustScaler on numeric, OHE on categorical
  - VotingClassifier (MLP, GB, HGB, RF, Ada, LR)
"""
import os
import math
import warnings
import pandas as pd
import numpy as np

try:
    import joblib
except ImportError:
    joblib = None


class CardioPredictor:

    # Candidate paths checked on startup (first found wins)
    MODEL_CANDIDATES = [
        os.path.join("models", "ensemble_model.pkl"),
        "ensemble_model.pkl",
    ]

    # Healthy-population reference values for chart context
    HEALTHY_NORMS = {
        "age_years":      44.0,
        "bmi":            24.5,
        "ap_hi":          120.0,
        "ap_lo":           80.0,
        "pulse_pressure":  40.0,
        "cholesterol":      1.0,   # 1=Normal
        "gluc":             1.0,   # 1=Normal
    }

    def __init__(self, model_path: str = None):
        self.model = None
        candidates = ([model_path] if model_path else []) + self.MODEL_CANDIDATES
        for path in candidates:
            if path and os.path.exists(path):
                try:
                    self._load(path)
                    print(f"[Predictor] Loaded model: {path}")
                    break
                except Exception as exc:
                    print(f"[Predictor] Failed to load {path}: {exc}")

        if self.model is None:
            print("[Predictor] WARNING — no model loaded. /api/predict will return an error.")

    # ── Public API ─────────────────────────────────────────────────────────

    def is_loaded(self) -> bool:
        return self.model is not None

    def load_model(self, path: str):
        """Hot-load a model file (used by /api/load_model route)."""
        self._load(path)

    def predict(self, raw: dict) -> dict:
        """
        raw keys (all strings or numbers as received from JSON):
            age_years, gender, height, weight,
            ap_hi, ap_lo, cholesterol, gluc,
            smoke, alco, active
        Returns a result dict or {"error": "..."}.
        """
        if not self.is_loaded():
            return {"error": "Model not loaded. Place ensemble_model.pkl in the app folder."}

        try:
            df      = self._build_dataframe(raw)
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                prob = float(self.model.predict_proba(df)[0][1])

            risk_pct = round(prob * 100, 1)
            result   = self._format_result(risk_pct, raw)
            result["chart_data"] = self._chart_data(raw, risk_pct)
            return result

        except Exception as exc:
            print(f"[Predictor] Prediction error: {exc}")
            return {"error": str(exc)}

    def default_values(self) -> dict:
        return {
            "age_years":   45,
            "gender":       2,          # 2 = Male
            "height":     170,
            "weight":      75.0,
            "ap_hi":      120,
            "ap_lo":       80,
            "cholesterol":  1,
            "gluc":         1,
            "smoke":        0,
            "alco":         0,
            "active":       1,
        }

    # ── Private helpers ────────────────────────────────────────────────────

    def _load(self, path: str):
        if not joblib:
            raise ImportError("joblib is required")
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self.model = joblib.load(path)

    def _build_dataframe(self, raw: dict) -> pd.DataFrame:
        """Reproduce the exact feature-engineering from training."""
        age_years = float(raw["age_years"])
        height    = float(raw["height"])
        weight    = float(raw["weight"])
        ap_hi     = float(raw["ap_hi"])
        ap_lo     = float(raw["ap_lo"])

        bmi            = weight / ((height / 100) ** 2)
        pulse_pressure = ap_hi - ap_lo

        row = {
            # Numeric (scaled by RobustScaler in pipeline)
            "age_years":      age_years,
            "height":         height,
            "weight":         weight,
            "ap_hi":          ap_hi,
            "ap_lo":          ap_lo,
            "bmi":            bmi,
            "pulse_pressure": pulse_pressure,
            # Categorical (one-hot-encoded in pipeline)
            "gender":      int(raw.get("gender",     2)),
            "cholesterol": int(raw.get("cholesterol", 1)),
            "gluc":        int(raw.get("gluc",        1)),
            "smoke":       int(raw.get("smoke",       0)),
            "alco":        int(raw.get("alco",        0)),
            "active":      int(raw.get("active",      1)),
        }
        return pd.DataFrame([row])

    def _format_result(self, pct: float, raw: dict) -> dict:
        if pct <= 30:
            cat, color, icon = "Low Risk",      "#22c55e", "✅"
        elif pct <= 60:
            cat, color, icon = "Moderate Risk", "#f59e0b", "⚠️"
        else:
            cat, color, icon = "High Risk",     "#ef4444", "🚨"

        return {
            "risk_percentage": pct,
            "risk_category":   cat,
            "color":           color,
            "icon":            icon,
            "bmi":             round(float(raw["weight"]) / ((float(raw["height"]) / 100) ** 2), 1),
            "recommendations": self._recommendations(raw, pct),
            "disclaimer":      (
                "This tool is for educational purposes only. "
                "Consult a qualified healthcare provider for diagnosis and treatment."
            ),
        }

    def _recommendations(self, raw: dict, pct: float) -> list:
        recs = []

        ap_hi = float(raw.get("ap_hi", 120))
        if ap_hi >= 140:
            recs.append("🩺 High systolic BP — reduce salt, exercise regularly and consult your doctor.")
        elif ap_hi >= 130:
            recs.append("🩺 Elevated blood pressure — monitor regularly and reduce sodium intake.")

        chol = int(raw.get("cholesterol", 1))
        if chol == 3:
            recs.append("🥗 High cholesterol — reduce saturated fats, increase fibre and vegetables.")
        elif chol == 2:
            recs.append("🥗 Above-normal cholesterol — consider a heart-healthy diet.")

        gluc = int(raw.get("gluc", 1))
        if gluc == 3:
            recs.append("🩸 High glucose — discuss diabetes screening and management with your doctor.")
        elif gluc == 2:
            recs.append("🩸 Above-normal glucose — dietary changes and regular monitoring are advised.")

        height = float(raw.get("height", 170))
        weight = float(raw.get("weight", 75))
        bmi    = weight / ((height / 100) ** 2)
        if bmi >= 30:
            recs.append("⚖️ BMI indicates obesity — achieving a healthy weight significantly lowers cardiac risk.")
        elif bmi >= 25:
            recs.append("⚖️ BMI indicates overweight — moderate weight loss benefits heart health.")

        if int(raw.get("smoke", 0)) == 1:
            recs.append("🚭 Quit smoking immediately — the single most impactful step for cardiovascular health.")

        if int(raw.get("alco", 0)) == 1:
            recs.append("🍷 Limit alcohol intake — heavy drinking raises blood pressure and cardiac risk.")

        if int(raw.get("active", 1)) == 0:
            recs.append("🏃 Start regular physical activity — aim for 150 min of moderate exercise per week.")
        else:
            recs.append("✅ Keep up your active lifestyle — regular exercise protects heart health.")

        if pct > 60:
            recs.append("⚠️ High overall risk — schedule a comprehensive cardiac evaluation promptly.")
        elif pct > 30:
            recs.append("📅 Schedule regular check-ups including BP, cholesterol and glucose panels.")

        recs.append("🔬 Annual health screenings are recommended regardless of current risk level.")
        return recs

    def _chart_data(self, raw: dict, risk_pct: float) -> dict:
        height = float(raw.get("height", 170))
        weight = float(raw.get("weight", 75))
        ap_hi  = float(raw.get("ap_hi",  120))
        ap_lo  = float(raw.get("ap_lo",   80))

        bmi            = weight / ((height / 100) ** 2)
        pulse_pressure = ap_hi - ap_lo

        # Age excluded: higher age is a natural process, not a clinical risk marker
        # in the same sense as BP or BMI, so showing it vs "healthy norm" is misleading.

        def norm(val, lo, hi):
            return max(0, min(100, (val - lo) / (hi - lo) * 100))

        n = self.HEALTHY_NORMS
        labels = ["Systolic BP", "Diastolic BP", "BMI", "Pulse Pressure"]

        user    = [norm(ap_hi, 70, 220),
                   norm(ap_lo, 40, 140),
                   norm(bmi, 15, 45),
                   norm(pulse_pressure, 10, 100)]

        healthy = [norm(n["ap_hi"], 70, 220),
                   norm(n["ap_lo"], 40, 140),
                   norm(n["bmi"], 15, 45),
                   norm(n["pulse_pressure"], 10, 100)]

        return {"labels": labels, "user": user, "healthy": healthy}
