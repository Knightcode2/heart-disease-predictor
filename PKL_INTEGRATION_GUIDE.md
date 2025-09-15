
# 🔗 PKL Model Integration Guide

## How to Use Your Trained Model

### Step 1: Prepare Your Model File
1. Ensure your model is saved as a `.pkl` file using pickle
2. Your model should be trained on data with these exact features (in this order):
   - Age (numeric)
   - Gender (encoded: Male=1, Female=0)
   - Cholesterol (numeric)
   - Blood Pressure (numeric) 
   - Heart Rate (numeric)
   - Smoking (encoded: Current=2, Former=1, Never=0)
   - Alcohol Intake (encoded: Heavy=0, Moderate=1, None=2)
   - Exercise Hours (numeric)
   - Family History (encoded: Yes=1, No=0)
   - Diabetes (encoded: Yes=1, No=0)
   - Obesity (encoded: Yes=1, No=0)
   - Stress Level (numeric)
   - Blood Sugar (numeric)
   - Exercise Induced Angina (encoded: Yes=1, No=0)
   - Chest Pain Type (encoded: varies by your training)

### Step 2: Model Integration Options

#### Option A: Direct File Placement (Recommended)
```bash
# Simply copy your model file to the project directory
cp /path/to/your/model.pkl ./model.pkl

# Start the server
python app.py
```

#### Option B: Runtime Upload
1. Start the server: `python app.py`
2. Use the API endpoint to upload your model:
```bash
curl -X POST -F "model_file=@your_model.pkl" http://localhost:5000/api/load_model
```

### Step 3: Verify Model Loading
```python
# Test your model integration
from heart_disease_backend import HeartDiseasePredictor

# Initialize with your model
predictor = HeartDiseasePredictor('model.pkl')

# Check if model loaded successfully
if predictor.model is not None:
    print("✅ Model loaded successfully!")
    print(f"Model type: {type(predictor.model)}")
else:
    print("❌ Model not loaded")
```

### Step 4: Model Requirements Check

Your PKL model must support one of these methods:
- `predict_proba(X)` - Returns probability scores (preferred)
- `predict(X)` - Returns binary predictions

Example test:
```python
import numpy as np
import pickle

# Load your model
with open('model.pkl', 'rb') as f:
    model = pickle.load(f)

# Test with sample data (15 features)
sample = np.array([[55, 1, 220, 140, 75, 1, 1, 3, 1, 0, 0, 6, 110, 0, 1]])

# Check if your model supports probability prediction
if hasattr(model, 'predict_proba'):
    proba = model.predict_proba(sample)
    print(f"Probability prediction: {proba}")
else:
    pred = model.predict(sample)
    print(f"Binary prediction: {pred}")
```

## 🔧 Troubleshooting Common Issues

### Issue 1: Model File Not Found
```
Error: [Errno 2] No such file or directory: 'model.pkl'
```
**Solution**: Ensure your PKL file is in the same directory as app.py

### Issue 2: Feature Count Mismatch
```
Error: X has n features, but model expects m features
```
**Solution**: Verify your model was trained on exactly 15 features in the correct order

### Issue 3: Categorical Encoding Mismatch  
```
Error: Unknown categories in input
```
**Solution**: The system automatically handles encoding, but ensure your model expects the same encoding scheme

### Issue 4: Scikit-learn Version Incompatibility
```
Error: cannot load model due to version mismatch
```
**Solution**: Try recreating your model with the current environment, or install the specific sklearn version used during training

## 📊 Model Performance Tips

### For Best Results:
1. **Use predict_proba()**: Provides probability scores for better risk assessment
2. **Proper Feature Scaling**: The system handles scaling automatically
3. **Categorical Encoding**: Handled automatically by the backend
4. **Cross-Validation**: Ensure your model was properly validated

### Expected Input Format (After Preprocessing):
```python
# Your model should expect this input shape: (n_samples, 15)
# Features will be preprocessed and scaled automatically
```

## 🚀 Ready to Deploy!

Once your model is integrated:

1. **Start the server**:
   ```bash
   python app.py
   ```

2. **Test the API**:
   ```bash
   curl -X POST http://localhost:5000/api/predict \
        -H "Content-Type: application/json" \
        -d '{"age": 55, "gender": "Male", "cholesterol": 220, ...}'
   ```

3. **Use the web interface**:
   - Open http://localhost:5000 in your browser
   - Fill out the form with patient data
   - Get instant risk predictions with recommendations

## 💡 Advanced Customization

### Custom Risk Thresholds
Edit `heart_disease_backend.py`, line ~200:
```python
if risk_percentage <= 30:      # Customize low risk threshold
    risk_category = "Low Risk"
elif risk_percentage <= 60:   # Customize moderate risk threshold  
    risk_category = "Moderate Risk"
else:
    risk_category = "High Risk"
```

### Custom Recommendations
Add your own medical advice in the `generate_recommendations()` method.

### Model Ensemble
Modify the backend to support multiple models and ensemble predictions.

---

**Your heart disease prediction website is ready! 🎉**

Just add your PKL model file and run `python app.py` to start serving predictions through the beautiful web interface.
