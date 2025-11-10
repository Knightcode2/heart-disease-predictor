
"""
Heart Disease Prediction Backend
Integrates with trained machine learning model (PKL file)
"""

import pickle
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
import json
import os

class HeartDiseasePredictor:
    def __init__(self, model_path=None):
        """
        Initialize the Heart Disease Predictor

        Args:
            model_path (str): Path to the trained model PKL file
        """
        self.model = None
        self.label_encoders = {}
        self.scaler = None
        self.feature_columns = [
            'Age', 'Gender', 'Cholesterol', 'Blood Pressure', 'Heart Rate',
            'Smoking', 'Alcohol Intake', 'Exercise Hours', 'Family History',
            'Diabetes', 'Obesity', 'Stress Level', 'Blood Sugar',
            'Exercise Induced Angina', 'Chest Pain Type'
        ]
        
        # Default values for form fields
        self.default_values = {
            "age": 45,
            "gender": "Male",
            "cholesterol": 200,
            "bloodPressure": 120,
            "heartRate": 75,
            "smoking": "Never",
            "alcoholIntake": "None",
            "exerciseHours": 3,
            "familyHistory": "No",
            "diabetes": "No",
            "obesity": "No",
            "stressLevel": 3,
            "bloodSugar": 100,
            "exerciseInducedAngina": "No",
            "chestPainType": "Asymptomatic"
        }

        # Always try models/ensemble_model.pkl, then root 'ensemble_model.pkl',
        # or a user-provided model_path.
        default_model_filenames = [
            os.path.join('models', 'ensemble_model.pkl'),
            'ensemble_model.pkl'
        ]

        if model_path:
            # provided explicit path takes precedence
            candidate_paths = [model_path] + default_model_filenames
        else:
            candidate_paths = default_model_filenames

        loaded = False
        for p in candidate_paths:
            if p and os.path.exists(p):
                try:
                    self.load_model(p)
                    print(f"Successfully loaded model from {p}")
                    loaded = True
                    break
                except Exception as e:
                    print(f"Failed to load model from {p}: {e}")
                    continue

        if not loaded:
            print("No model loaded; using rule-based fallback prediction")

        # Initialize data preprocessing
        self.setup_preprocessors()

    def setup_preprocessors(self):
        """Setup label encoders and scalers based on the training data"""
        try:
            # Load the cleaned dataset to understand the data structure
            # Try data/ first, then root filename
            cleaned_paths = [os.path.join('data', 'heart_disease_cleaned.csv'), 'heart_disease_cleaned.csv', 'heart_disease_cleaned.csv.csv']
            df = None
            for p in cleaned_paths:
                if os.path.exists(p):
                    df = pd.read_csv(p)
                    break

            if df is None:
                raise FileNotFoundError('cleaned dataset not found in data/ or project root')

            # Initialize label encoders for categorical variables
            categorical_columns = ['Gender', 'Smoking', 'Alcohol Intake', 'Family History',
                                 'Diabetes', 'Obesity', 'Exercise Induced Angina', 'Chest Pain Type']

            for col in categorical_columns:
                if col in df.columns:
                    le = LabelEncoder()
                    le.fit(df[col])
                    self.label_encoders[col] = le

            # Initialize scaler for numerical features
            numerical_columns = ['Age', 'Cholesterol', 'Blood Pressure', 'Heart Rate',
                               'Exercise Hours', 'Stress Level', 'Blood Sugar']

            if len(numerical_columns) > 0:
                self.scaler = StandardScaler()
                self.scaler.fit(df[numerical_columns])

        except FileNotFoundError:
            print("Warning: heart_disease_cleaned.csv not found. Using default preprocessing.")

    def load_model(self, model_path):
        """
        Load the trained model from PKL file

        Args:
            model_path (str): Path to the PKL model file
        """
        try:
            with open(model_path, 'rb') as file:
                self.model = pickle.load(file)
            print(f"Model loaded successfully from {model_path}")
        except Exception as e:
            print(f"Error loading model: {e}")

    def get_default_values(self):
        """
        Get default values for form fields
        
        Returns:
            dict: Default values for all form fields
        """
        return self.default_values
        
    def preprocess_input(self, input_data):
        """
        Preprocess input data for prediction

        Args:
            input_data (dict): Dictionary containing user inputs

        Returns:
            np.array: Preprocessed data ready for model prediction
        """
        # Create DataFrame from input
        df = pd.DataFrame([input_data])

        # Ensure all required columns are present
        for col in self.feature_columns:
            if col not in df.columns:
                # Set default values if missing
                if col in ['Family History', 'Diabetes', 'Obesity', 'Exercise Induced Angina']:
                    df[col] = 'No'
                elif col == 'Gender':
                    df[col] = 'Male'
                elif col == 'Smoking':
                    df[col] = 'Never'
                elif col == 'Alcohol Intake':
                    df[col] = 'None'
                elif col == 'Chest Pain Type':
                    df[col] = 'Asymptomatic'
                else:
                    df[col] = 0

        # Apply label encoding to categorical variables
        for col, encoder in self.label_encoders.items():
            if col in df.columns:
                try:
                    df[col] = encoder.transform(df[col])
                except ValueError:
                    # Handle unknown categories
                    df[col] = 0

        # Apply scaling to numerical features
        numerical_columns = ['Age', 'Cholesterol', 'Blood Pressure', 'Heart Rate',
                           'Exercise Hours', 'Stress Level', 'Blood Sugar']

        if self.scaler:
            df[numerical_columns] = self.scaler.transform(df[numerical_columns])

        # Return as numpy array in the correct order
        # Convert to numpy array and ensure no feature names to avoid sklearn warnings
        result = df[self.feature_columns].values
        return result

    def predict_risk(self, input_data):
        """
        Predict heart disease risk

        Args:
            input_data (dict): User input data

        Returns:
            dict: Prediction results with probability and risk category
        """
        if self.model is None:
            # Fallback prediction if no model is loaded
            return self.fallback_prediction(input_data)

        try:
            # Preprocess input
            processed_data = self.preprocess_input(input_data)

            # Make prediction
            if hasattr(self.model, 'predict_proba'):
                # Get probability of positive class (heart disease)
                proba = self.model.predict_proba(processed_data)[0][1]
                risk_percentage = round(proba * 100, 1)
            else:
                # Binary prediction only
                prediction = self.model.predict(processed_data)[0]
                risk_percentage = 85.0 if prediction == 1 else 15.0

            return self.format_prediction_result(risk_percentage, input_data)

        except Exception as e:
            print(f"Error in prediction: {e}")
            return self.fallback_prediction(input_data)

    def fallback_prediction(self, input_data):
        """
        Fallback prediction method when model is not available
        Uses rule-based approach based on medical knowledge
        """
        risk_score = 0

        # Age factor (older = higher risk)
        age = int(input_data.get('Age', 50))
        if age >= 65:
            risk_score += 25
        elif age >= 55:
            risk_score += 15
        elif age >= 45:
            risk_score += 10

        # Gender factor (males generally higher risk)
        if input_data.get('Gender') == 'Male':
            risk_score += 10

        # Cholesterol factor
        cholesterol = int(input_data.get('Cholesterol', 200))
        if cholesterol >= 240:
            risk_score += 20
        elif cholesterol >= 200:
            risk_score += 10

        # Blood pressure factor
        bp = int(input_data.get('Blood Pressure', 120))
        if bp >= 140:
            risk_score += 20
        elif bp >= 130:
            risk_score += 10

        # Smoking factor
        smoking = input_data.get('Smoking', 'Never')
        if smoking == 'Current':
            risk_score += 25
        elif smoking == 'Former':
            risk_score += 10

        # Diabetes factor
        if input_data.get('Diabetes') == 'Yes':
            risk_score += 20

        # Family history factor
        if input_data.get('Family History') == 'Yes':
            risk_score += 15

        # Obesity factor
        if input_data.get('Obesity') == 'Yes':
            risk_score += 15

        # Exercise factor (protective)
        exercise_hours = int(input_data.get('Exercise Hours', 3))
        if exercise_hours >= 5:
            risk_score -= 10
        elif exercise_hours >= 3:
            risk_score -= 5

        # Stress factor
        stress = int(input_data.get('Stress Level', 5))
        if stress >= 8:
            risk_score += 10
        elif stress >= 6:
            risk_score += 5

        # Ensure risk score is within 0-100 range
        risk_percentage = max(5, min(95, risk_score))

        return self.format_prediction_result(risk_percentage, input_data)

    def format_prediction_result(self, risk_percentage, input_data):
        """Format the prediction result with recommendations"""

        # Determine risk category
        if risk_percentage <= 30:
            risk_category = "Low Risk"
            color = "#22c55e"  # Green
        elif risk_percentage <= 60:
            risk_category = "Moderate Risk"
            color = "#f59e0b"  # Yellow
        else:
            risk_category = "High Risk"
            color = "#ef4444"  # Red

        # Generate recommendations
        recommendations = self.generate_recommendations(input_data, risk_percentage)

        return {
            "risk_percentage": risk_percentage,
            "risk_category": risk_category,
            "color": color,
            "recommendations": recommendations,
            "disclaimer": "This is a risk assessment tool and should not replace professional medical advice. Please consult with a healthcare provider for proper diagnosis and treatment."
        }

    def generate_recommendations(self, input_data, risk_percentage):
        """Generate personalized recommendations based on input data"""
        recommendations = []

        # Smoking recommendations
        smoking = input_data.get('Smoking', 'Never')
        if smoking == 'Current':
            recommendations.append("🚭 Quit smoking immediately - this is the single most important step for heart health")
        elif smoking == 'Former':
            recommendations.append("✅ Continue avoiding tobacco - great job on quitting!")

        # Exercise recommendations
        exercise_hours = int(input_data.get('Exercise Hours', 3))
        if exercise_hours < 3:
            recommendations.append("🏃 Increase physical activity - aim for at least 150 minutes of moderate exercise per week")
        elif exercise_hours >= 5:
            recommendations.append("✅ Excellent exercise routine - keep up the great work!")

        # Diet recommendations based on cholesterol
        cholesterol = int(input_data.get('Cholesterol', 200))
        if cholesterol >= 200:
            recommendations.append("🥗 Focus on heart-healthy diet - reduce saturated fats and increase fruits and vegetables")

        # Blood pressure recommendations
        bp = int(input_data.get('Blood Pressure', 120))
        if bp >= 130:
            recommendations.append("🩺 Monitor blood pressure regularly and consider dietary changes to reduce sodium")

        # Stress management
        stress = int(input_data.get('Stress Level', 5))
        if stress >= 6:
            recommendations.append("🧘 Practice stress management techniques like meditation, yoga, or deep breathing")

        # Weight management
        if input_data.get('Obesity') == 'Yes':
            recommendations.append("⚖️ Work on achieving a healthy weight through balanced diet and regular exercise")

        # Alcohol recommendations
        alcohol = input_data.get('Alcohol Intake', 'None')
        if alcohol == 'Heavy':
            recommendations.append("🍷 Consider reducing alcohol consumption to moderate levels")

        # General recommendations based on risk level
        if risk_percentage > 60:
            recommendations.append("⚠️ Schedule an appointment with your doctor for a comprehensive cardiac evaluation")
            recommendations.append("💊 Consider discussing preventive medications with your healthcare provider")
        elif risk_percentage > 30:
            recommendations.append("📅 Schedule regular check-ups with your healthcare provider")

        recommendations.append("🔬 Consider regular health screenings including lipid panels and blood pressure checks")

        return recommendations

# Example usage and testing
def test_predictor():
    """Test function to demonstrate the predictor"""

    # Sample input data
    sample_input = {
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

    # Initialize predictor
    predictor = HeartDiseasePredictor()

    # Make prediction
    result = predictor.predict_risk(sample_input)

    print("Sample Prediction Result:")
    print(f"Risk Percentage: {result['risk_percentage']}%")
    print(f"Risk Category: {result['risk_category']}")
    print("Recommendations:")
    for rec in result['recommendations']:
        print(f"  - {rec}")

    return result

if __name__ == "__main__":
    test_result = test_predictor()
