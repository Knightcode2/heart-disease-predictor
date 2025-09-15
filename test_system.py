#!/usr/bin/env python3
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
        print(f"\n🔬 Test Case {i}: {test_case['name']}")
        print("-" * 30)

        result = predictor.predict_risk(test_case['data'])

        print(f"Risk Percentage: {result['risk_percentage']}%")
        print(f"Risk Category: {result['risk_category']}")
        print("Top Recommendations:")
        for j, rec in enumerate(result['recommendations'][:3], 1):
            print(f"  {j}. {rec}")

        print()

    print("✅ Testing completed successfully!")
    print("\n🚀 Ready to start the web server with: python app.py")

if __name__ == "__main__":
    test_prediction_system()
