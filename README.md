
# Heart Disease Prediction Website - Setup Instructions

## 📋 Project Overview
A comprehensive web application for predicting heart disease risk percentage based on medical and lifestyle factors. The system includes a modern web interface and a Python backend that can integrate with your trained machine learning model.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Prepare Your Model
- Save your trained PKL model file as `model.pkl` in the project directory
- Or use the web interface to upload your model later

### 3. Run the Application
```bash
python app.py
```

### 4. Access the Web Application
- Open your browser and go to: `http://localhost:5000`
- The heart disease prediction interface will be ready to use!

## 📁 Project Structure
```
heart-disease-predictor/
├── app.py                          # Flask web server
├── heart_disease_backend.py        # ML model integration
├── index.html                      # Web interface (from deployed app)
├── style.css                       # Styling (from deployed app)
├── app.js                          # Frontend JavaScript (from deployed app)
├── requirements.txt                # Python dependencies
├── heart_disease_dataset-final.csv # Original dataset
├── heart_disease_cleaned.csv       # Cleaned dataset
├── model.pkl                       # Your trained model (place here)
└── README.md                       # This file
```

## 🔧 Integration with Your PKL Model

### Method 1: Direct File Placement
1. Save your trained model as `model.pkl` in the project root
2. The system will automatically load and use your model

### Method 2: Runtime Upload
1. Start the server with `python app.py`
2. Use the `/api/load_model` endpoint to upload your PKL file
3. The model will be loaded and ready for predictions

### Model Requirements
Your PKL model should:
- Accept input features in this order:
  ```python
  ['Age', 'Gender', 'Cholesterol', 'Blood Pressure', 'Heart Rate',
   'Smoking', 'Alcohol Intake', 'Exercise Hours', 'Family History',
   'Diabetes', 'Obesity', 'Stress Level', 'Blood Sugar',
   'Exercise Induced Angina', 'Chest Pain Type']
  ```
- Support `predict_proba()` method for probability predictions (recommended)
- Or support `predict()` method for binary classification

## 🌐 API Endpoints

### POST /api/predict
Predicts heart disease risk based on input parameters.

**Request Example:**
```json
{
    "age": 55,
    "gender": "Male",
    "cholesterol": 220,
    "bloodPressure": 140,
    "heartRate": 75,
    "smoking": "Former",
    "alcoholIntake": "Moderate",
    "exerciseHours": 3,
    "familyHistory": "Yes",
    "diabetes": "No",
    "obesity": "No",
    "stressLevel": 6,
    "bloodSugar": 110,
    "exerciseInducedAngina": "No",
    "chestPainType": "Atypical Angina"
}
```

**Response Example:**
```json
{
    "risk_percentage": 45.2,
    "risk_category": "Moderate Risk",
    "color": "#f59e0b",
    "recommendations": [
        "🚭 Consider quitting smoking for better heart health",
        "🏃 Increase physical activity to at least 150 minutes per week"
    ],
    "disclaimer": "This is a risk assessment tool..."
}
```

### GET /api/health
Check if the server is running and model is loaded.

### GET /api/model_info
Get information about the currently loaded model.

### POST /api/load_model
Upload and load a new PKL model file.

## 🎨 Web Interface Features

- **Modern Design**: Professional medical-themed interface
- **Interactive Forms**: Sliders, dropdowns, and radio buttons
- **Real-time Validation**: Input validation and error handling
- **Risk Visualization**: Color-coded risk levels with percentages
- **Personalized Recommendations**: Custom advice based on input factors
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Loading Animations**: Smooth user experience with loading indicators

## 🧪 Testing the System

### Test with Sample Data
```python
from heart_disease_backend import HeartDiseasePredictor

# Initialize predictor
predictor = HeartDiseasePredictor('model.pkl')  # Use your model file

# Sample input
sample_data = {
    "Age": 55,
    "Gender": "Male",
    "Cholesterol": 220,
    "Blood Pressure": 140,
    "Heart Rate": 75,
    "Smoking": "Former",
    "Alcohol Intake": "Moderate",
    "Exercise Hours": 3,
    "Family History": "Yes",
    "Diabetes": "No",
    "Obesity": "No",
    "Stress Level": 6,
    "Blood Sugar": 110,
    "Exercise Induced Angina": "No",
    "Chest Pain Type": "Atypical Angina"
}

# Make prediction
result = predictor.predict_risk(sample_data)
print(f"Risk: {result['risk_percentage']}%")
```

## 🔧 Customization Options

## 📦 Portable distribution
If you want to make a portable Windows build you can copy to a USB drive, see the `portable/` folder for instructions and scripts to build a PyInstaller one-folder distribution.

### Adding New Features
1. Update the `feature_columns` list in `heart_disease_backend.py`
2. Add corresponding form fields in the web interface
3. Update the preprocessing logic

### Modifying Risk Categories
Edit the `format_prediction_result` method in `heart_disease_backend.py`:
```python
if risk_percentage <= 25:      # Low risk threshold
    risk_category = "Low Risk"
elif risk_percentage <= 65:   # Moderate risk threshold
    risk_category = "Moderate Risk"
else:
    risk_category = "High Risk"
```

### Custom Recommendations
Modify the `generate_recommendations` method to add your own medical advice logic.

## 🚨 Important Notes

- **Medical Disclaimer**: This tool is for educational/research purposes only
- **Not for Clinical Use**: Should not replace professional medical diagnosis
- **Data Privacy**: Ensure compliance with healthcare data regulations
- **Model Validation**: Thoroughly validate your model before deployment

## 🐛 Troubleshooting

### Model Not Loading
- Check if PKL file exists and is readable
- Ensure model is compatible with current scikit-learn version
- Check file permissions

### Prediction Errors
- Verify input data format matches expected features
- Check for missing or invalid categorical values
- Review preprocessing steps

### Server Issues
- Check if port 5000 is available
- Verify all dependencies are installed
- Check Python version compatibility (3.7+)

## 📞 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify your model file format and compatibility
3. Ensure all dependencies are correctly installed
4. Review the API documentation for correct input format

## 🔄 Updates and Improvements

Future enhancements could include:
- Model comparison tools
- Batch prediction capability
- Advanced visualization charts
- Integration with electronic health records
- Multi-language support

---

**Created by**: Vivek Kumar
**Version**: 1.0
**Last Updated**: November 2025
