"""
Heart Disease Prediction Backend — Cardio Train Model
======================================================
Adapted for the cardio_train.csv-trained VotingClassifier Pipeline.

Model input features (11, in this order after preprocessing):
  Continuous (RobustScaler):
    age_years, height, weight, ap_hi, ap_lo, bmi, pulse_pressure
  Categorical (OneHotEncoder drop='first'):
    gender, cholesterol, gluc, smoke, alco, active

Frontend sends human-friendly values; this backend converts them:
  age        → age_years (years, integer)
  gender     → 1=Female, 2=Male
  height     → cm (exact)
  weight     → kg (exact)
  ap_hi      → systolic BP (exact)
  ap_lo      → diastolic BP (exact)
  cholesterol→ 1/2/3 category
  gluc       → 1/2/3 category
  smoke      → 0=No, 1=Yes
  alco       → 0=No, 1=Yes
  active     → 0=No, 1=Yes

REMOVED fields (not used by this model):
  Heart Rate, Stress Level, Family History, Diabetes (Yes/No),
  Obesity, Exercise Induced Angina, Chest Pain Type, Blood Sugar slider
"""

import os
import math
import warnings

import numpy as np
import pandas as pd

try:
    import joblib
    _JOBLIB_OK = True
except ImportError:
    _JOBLIB_OK = False

try:
    import pickle
except ImportError:
    pickle = None


class HeartDiseasePredictor:
    """
    Wraps the cardio_train-trained sklearn Pipeline (preprocessor + VotingClassifier).
    """

    def __init__(self, model_path=None):
        self.model = None

        # Default values for the updated frontend form
        self.default_values = {
            "age":          45,       # years
            "gender":       "Female", # Female / Male
            "height":       165,      # cm
            "weight":       70.0,     # kg
            "ap_hi":        120,      # systolic mmHg
            "ap_lo":        80,       # diastolic mmHg
            "cholesterol":  1,        # 1=Normal, 2=Above, 3=High
            "gluc":         1,        # 1=Normal, 2=Above, 3=High
            "smoke":        0,        # 0=No, 1=Yes
            "alco":         0,        # 0=No, 1=Yes
            "active":       1,        # 0=No, 1=Yes
        }

        candidates = []
        if model_path:
            candidates.append(model_path)
        candidates += [
            os.path.join('models', 'cardio_model.pkl'),
            'cardio_model.pkl',
            os.path.join('models', 'ensemble_model.pkl'),
            'ensemble_model.pkl',
        ]

        for path in candidates:
            if path and os.path.exists(path):
                try:
                    self._load(path)
                    print(f"[Backend] Model loaded: {path}")
                    break
                except Exception as exc:
                    print(f"[Backend] Failed {path}: {exc}")

        if self.model is None:
            print("[Backend] No model found — rule-based fallback active.")

    # ── Public API ────────────────────────────────────────────────────

    def get_default_values(self):
        return self.default_values

    def load_model(self, path):
        self._load(path)

    def predict_risk(self, raw):
        """
        raw (dict): values from the frontend using the keys defined in
                    get_default_values().
        Returns dict: risk_percentage, risk_category, color,
                      recommendations, disclaimer, model_used.
        """
        if self.model is None:
            r = self._fallback(raw)
            r['model_used'] = 'rule_based_fallback'
            return r

        try:
            df       = self._build_df(raw)
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                proba = float(self.model.predict_proba(df)[0][1])
            risk_pct = round(proba * 100, 1)
            r = self._format(risk_pct, raw)
            r['model_used'] = 'cardio_ml'
            return r

        except Exception as exc:
            print(f"[Backend] Prediction error: {exc}")
            r = self._fallback(raw)
            r['model_used'] = 'rule_based_fallback'
            return r

    # ── Private helpers ───────────────────────────────────────────────

    def _load(self, path):
        """Try joblib first, then pickle."""
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            if _JOBLIB_OK:
                self.model = joblib.load(path)
            elif pickle:
                with open(path, 'rb') as f:
                    self.model = pickle.load(f)
            else:
                raise ImportError("joblib or pickle required")

    def _build_df(self, raw):
        """
        Convert frontend dict → single-row DataFrame matching training schema.

        Training columns (before pipeline preprocessor):
          age, gender, height, weight, ap_hi, ap_lo,
          cholesterol, gluc, smoke, alco, active
        Plus engineered:
          age_years, bmi, pulse_pressure
        Then drop 'age'.
        """
        age_years      = float(raw.get('age', 45))
        gender_val     = 2 if str(raw.get('gender', 'Male')).strip() == 'Male' else 1
        height         = float(raw.get('height', 165))
        weight         = float(raw.get('weight', 70))
        ap_hi          = float(raw.get('ap_hi', 120))
        ap_lo          = float(raw.get('ap_lo', 80))
        cholesterol    = int(raw.get('cholesterol', 1))
        gluc           = int(raw.get('gluc', 1))
        smoke          = int(raw.get('smoke', 0))
        alco           = int(raw.get('alco', 0))
        active         = int(raw.get('active', 1))

        bmi            = weight / ((height / 100) ** 2)
        pulse_pressure = ap_hi - ap_lo

        # The training script drops 'age' and uses 'age_years'
        row = {
            'age_years':     age_years,
            'height':        height,
            'weight':        weight,
            'ap_hi':         ap_hi,
            'ap_lo':         ap_lo,
            'bmi':           bmi,
            'pulse_pressure': pulse_pressure,
            'gender':        gender_val,
            'cholesterol':   cholesterol,
            'gluc':          gluc,
            'smoke':         smoke,
            'alco':          alco,
            'active':        active,
        }
        return pd.DataFrame([row])

    def _fallback(self, raw):
        """Rule-based scorer when ML model is unavailable."""
        score = 0

        age = float(raw.get('age', 45))
        if age >= 60:   score += 25
        elif age >= 50: score += 15
        elif age >= 40: score += 8

        if str(raw.get('gender', 'Male')) == 'Male':
            score += 8

        ap_hi = float(raw.get('ap_hi', 120))
        ap_lo = float(raw.get('ap_lo', 80))
        if ap_hi >= 160:  score += 25
        elif ap_hi >= 140: score += 15
        elif ap_hi >= 130: score += 8
        if ap_lo >= 100:  score += 10
        elif ap_lo >= 90: score += 5

        chol = int(raw.get('cholesterol', 1))
        if chol == 3:    score += 20
        elif chol == 2:  score += 10

        gluc = int(raw.get('gluc', 1))
        if gluc == 3:    score += 15
        elif gluc == 2:  score += 7

        if int(raw.get('smoke', 0)) == 1:  score += 15
        if int(raw.get('alco', 0))  == 1:  score += 8
        if int(raw.get('active', 1)) == 0: score += 10

        h = float(raw.get('height', 165))
        w = float(raw.get('weight', 70))
        bmi = w / ((h / 100) ** 2)
        if bmi >= 30:   score += 15
        elif bmi >= 25: score += 7

        risk_pct = max(5.0, min(95.0, float(score)))
        return self._format(risk_pct, raw)

    def _format(self, risk_pct, raw):
        if risk_pct <= 30:
            cat, color = "Low Risk",      "#22c55e"
        elif risk_pct <= 55:
            cat, color = "Moderate Risk", "#f59e0b"
        else:
            cat, color = "High Risk",     "#ef4444"

        return {
            "risk_percentage": risk_pct,
            "risk_category":   cat,
            "color":           color,
            "recommendations": self._recs(raw, risk_pct),
            "disclaimer": (
                "This tool is for educational purposes only and does not "
                "replace professional medical advice. Consult a qualified "
                "healthcare provider for proper diagnosis and treatment."
            ),
        }

    def _recs(self, raw, risk_pct):
        recs = []

        ap_hi = float(raw.get('ap_hi', 120))
        ap_lo = float(raw.get('ap_lo', 80))
        if ap_hi >= 140 or ap_lo >= 90:
            recs.append("🩺 Your blood pressure is elevated. Reduce sodium intake, exercise regularly, and consult your doctor.")
        elif ap_hi >= 130:
            recs.append("🩺 Blood pressure is borderline high. Monitor it regularly and reduce salt.")

        chol = int(raw.get('cholesterol', 1))
        if chol == 3:
            recs.append("🥗 High cholesterol detected. Follow a heart-healthy diet: less saturated fat, more fibre and vegetables.")
        elif chol == 2:
            recs.append("🥗 Cholesterol is above normal. Consider dietary improvements and get a full lipid panel.")

        gluc = int(raw.get('gluc', 1))
        if gluc == 3:
            recs.append("🩸 Blood glucose is well above normal — consult your doctor about diabetes management.")
        elif gluc == 2:
            recs.append("🩸 Blood glucose is above normal. Monitor diet and consider a glucose tolerance test.")

        if int(raw.get('smoke', 0)) == 1:
            recs.append("🚭 Smoking significantly increases cardiovascular risk. Quitting is the single most impactful step.")

        if int(raw.get('alco', 0)) == 1:
            recs.append("🍷 Alcohol consumption raises blood pressure. Limiting intake helps heart health.")

        if int(raw.get('active', 1)) == 0:
            recs.append("🏃 You are sedentary. Aim for at least 150 minutes of moderate exercise per week.")
        else:
            recs.append("✅ Staying physically active is great for your heart — keep it up!")

        h = float(raw.get('height', 165))
        w = float(raw.get('weight', 70))
        bmi = w / ((h / 100) ** 2)
        if bmi >= 30:
            recs.append(f"⚖️ Your BMI is {bmi:.1f} (obese range). Weight loss through diet and exercise reduces cardiac risk significantly.")
        elif bmi >= 25:
            recs.append(f"⚖️ Your BMI is {bmi:.1f} (overweight). Modest weight loss can lower blood pressure and cholesterol.")

        if risk_pct > 55:
            recs.append("⚠️ Your overall risk is high. Please schedule a comprehensive cardiovascular evaluation with your doctor.")
            recs.append("💊 Discuss preventive medications (statins, antihypertensives) with your healthcare provider.")
        elif risk_pct > 30:
            recs.append("📅 Schedule regular check-ups including blood pressure and lipid panel screenings.")

        recs.append("🔬 Annual health screenings (BP, cholesterol, glucose) are recommended for everyone over 40.")
        return recs


# ── Self-test ──────────────────────────────────────────────────────────
def _test():
    p = HeartDiseasePredictor()
    cases = [
        ("Young healthy female", {"age": 30, "gender": "Female", "height": 165, "weight": 58,
          "ap_hi": 110, "ap_lo": 70, "cholesterol": 1, "gluc": 1, "smoke": 0, "alco": 0, "active": 1}),
        ("Middle-aged smoker male", {"age": 52, "gender": "Male", "height": 175, "weight": 90,
          "ap_hi": 150, "ap_lo": 95, "cholesterol": 2, "gluc": 1, "smoke": 1, "alco": 1, "active": 0}),
        ("High-risk elder male", {"age": 63, "gender": "Male", "height": 170, "weight": 105,
          "ap_hi": 180, "ap_lo": 110, "cholesterol": 3, "gluc": 3, "smoke": 1, "alco": 1, "active": 0}),
    ]
    for label, d in cases:
        r = p.predict_risk(d)
        print(f"{label}: {r['risk_percentage']}% | {r['risk_category']} | {r.get('model_used')}")

if __name__ == "__main__":
    _test()
