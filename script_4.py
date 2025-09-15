# Create requirements.txt for the project
requirements = '''
Flask==2.3.3
flask-cors==4.0.0
pandas==2.0.3
numpy==1.24.3
scikit-learn==1.3.0
pickle-mixin==1.0.2
'''

with open('requirements.txt', 'w') as f:
    f.write(requirements.strip())

print("Requirements file created: requirements.txt")

# Create setup instructions
setup_instructions = '''
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

**Created by**: AI Assistant
**Version**: 1.0
**Last Updated**: December 2024
'''

with open('README.md', 'w') as f:
    f.write(setup_instructions)

print("Setup instructions created: README.md")

# Create a simple test script
test_script = '''#!/usr/bin/env python3
"""
Simple test script for the Heart Disease Prediction system
"""

from heart_disease_backend import HeartDiseasePredictor
import json

def test_prediction_system():
    """Test the prediction system with sample data"""
    
    print("🧪 Testing Heart Disease Prediction System")
    print("=" * 50)
    
    # Initialize predictor
    predictor = HeartDiseasePredictor()
    
    # Test cases
    test_cases = [
        {
            "name": "Low Risk Patient",
            "data": {
                "Age": 30,
                "Gender": "Female",
                "Cholesterol": 180,
                "Blood Pressure": 110,
                "Heart Rate": 70,
                "Smoking": "Never",
                "Alcohol Intake": "None",
                "Exercise Hours": 6,
                "Family History": "No",
                "Diabetes": "No",
                "Obesity": "No",
                "Stress Level": 3,
                "Blood Sugar": 90,
                "Exercise Induced Angina": "No",
                "Chest Pain Type": "Asymptomatic"
            }
        },
        {
            "name": "High Risk Patient",
            "data": {
                "Age": 65,
                "Gender": "Male",
                "Cholesterol": 280,
                "Blood Pressure": 160,
                "Heart Rate": 85,
                "Smoking": "Current",
                "Alcohol Intake": "Heavy",
                "Exercise Hours": 1,
                "Family History": "Yes",
                "Diabetes": "Yes",
                "Obesity": "Yes",
                "Stress Level": 9,
                "Blood Sugar": 150,
                "Exercise Induced Angina": "Yes",
                "Chest Pain Type": "Typical Angina"
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\\n🔬 Test Case {i}: {test_case['name']}")
        print("-" * 30)
        
        result = predictor.predict_risk(test_case['data'])
        
        print(f"Risk Percentage: {result['risk_percentage']}%")
        print(f"Risk Category: {result['risk_category']}")
        print("Top Recommendations:")
        for j, rec in enumerate(result['recommendations'][:3], 1):
            print(f"  {j}. {rec}")
        
        print()
    
    print("✅ Testing completed successfully!")
    print("\\n🚀 Ready to start the web server with: python app.py")

if __name__ == "__main__":
    test_prediction_system()
'''

with open('test_system.py', 'w') as f:
    f.write(test_script)

print("Test script created: test_system.py")
print("\n✅ All files created successfully!")
print("\n📁 Project files created:")
print("- heart_disease_backend.py (ML model integration)")
print("- app.py (Flask web server)")
print("- requirements.txt (Python dependencies)")
print("- README.md (Setup instructions)")
print("- test_system.py (Testing script)")
print("- heart_disease_cleaned.csv (Cleaned dataset)")

print("\n🎯 Next Steps:")
print("1. Install dependencies: pip install -r requirements.txt")
print("2. Place your PKL model file as 'model.pkl' in the project directory")
print("3. Run the server: python app.py")
print("4. Access the web app at: http://localhost:5000")