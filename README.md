# CardioRisk — Cardiovascular Disease Risk Assessment

## Setup & Run

1. **Place your model file** — copy `ensemble_model.pkl` into this folder (same level as `app.py`).

2. **Install dependencies**
   ```
   pip install -r requirements.txt
   ```

3. **Run the server**
   ```
   python app.py
   ```

4. Open **http://localhost:5000** in your browser.

---

## Model expected inputs

The model (`ensemble_model.pkl`) is a `sklearn.pipeline.Pipeline` trained on the
Kaggle Cardiovascular Disease dataset (`cardio_train.csv`).

| Field | Type | Notes |
|---|---|---|
| age_years | float | Age in years (converted to days internally in training, reversed here) |
| gender | int | 1 = Female, 2 = Male |
| height | float | cm |
| weight | float | kg |
| ap_hi | int | Systolic blood pressure (mmHg) |
| ap_lo | int | Diastolic blood pressure (mmHg) |
| cholesterol | int | 1=Normal, 2=Above Normal, 3=Well Above Normal |
| gluc | int | 1=Normal, 2=Above Normal, 3=Well Above Normal |
| smoke | int | 0 = No, 1 = Yes |
| alco | int | 0 = No, 1 = Yes |
| active | int | 0 = No, 1 = Yes |

The backend auto-engineers `bmi`, `pulse_pressure`, and `age_years` before passing
to the pipeline's `ColumnTransformer` preprocessor.

---

## sklearn version requirement

Your `ensemble_model.pkl` requires **scikit-learn 1.5.x** to load.
`requirements.txt` pins `scikit-learn==1.5.2` — do not change this.
