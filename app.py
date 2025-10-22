
"""
Flask Web Server for Heart Disease Prediction
Serves the web application and provides API endpoints
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from heart_disease_backend import HeartDiseasePredictor

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Initialize the predictor
predictor = HeartDiseasePredictor()

@app.route('/')
def index():
    """Serve the main web application"""
    return app.send_static_file('index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, etc.)"""
    return app.send_static_file(filename)

@app.route('/api/predict', methods=['POST'])
def predict_heart_disease():
    """
    API endpoint for heart disease prediction

    Expected JSON format:
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
    """
    try:
        # Get JSON data from request
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Convert frontend field names to backend format
        input_data = {
            "Age": data.get('age'),
            "Gender": data.get('gender'),
            "Cholesterol": data.get('cholesterol'),
            "Blood Pressure": data.get('bloodPressure'),
            "Heart Rate": data.get('heartRate'),
            "Smoking": data.get('smoking'),
            "Alcohol Intake": data.get('alcoholIntake'),
            "Exercise Hours": data.get('exerciseHours'),
            "Family History": data.get('familyHistory'),
            "Diabetes": data.get('diabetes'),
            "Obesity": data.get('obesity'),
            "Stress Level": data.get('stressLevel'),
            "Blood Sugar": data.get('bloodSugar'),
            "Exercise Induced Angina": data.get('exerciseInducedAngina'),
            "Chest Pain Type": data.get('chestPainType')
        }

        # Validate required fields
        required_fields = ["Age", "Gender", "Cholesterol", "Blood Pressure", "Heart Rate"]
        for field in required_fields:
            if input_data[field] is None:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Make prediction
        result = predictor.predict_risk(input_data)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

@app.route('/api/load_model', methods=['POST'])
def load_model():
    """
    Load a new model from uploaded PKL file
    """
    try:
        if 'model_file' not in request.files:
            return jsonify({"error": "No model file provided"}), 400

        file = request.files['model_file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        if file and file.filename.endswith('.pkl'):
            # Save uploaded file
            filename = 'uploaded_model.pkl'
            file.save(filename)

            # Load the new model
            predictor.load_model(filename)

            return jsonify({"message": "Model loaded successfully"})
        else:
            return jsonify({"error": "Please upload a .pkl file"}), 400

    except Exception as e:
        return jsonify({"error": f"Failed to load model: {str(e)}"}), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": predictor.model is not None,
        "message": "Heart Disease Prediction API is running"
    })

@app.route('/api/model_info')
def model_info():
    """Get information about the loaded model"""
    return jsonify({
        "model_loaded": predictor.model is not None,
        "model_type": str(type(predictor.model)) if predictor.model else None,
        "features": predictor.feature_columns,
        "preprocessors_ready": len(predictor.label_encoders) > 0
    })

@app.route('/api/default_values', methods=['GET'])
def default_values():
    """Get default values for form fields"""
    try:
        defaults = predictor.get_default_values()
        return jsonify({
            "status": "success",
            "default_values": defaults
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Heart Disease Prediction Server...")
    print("📊 Web Application: http://localhost:5000")
    print("🔗 API Endpoint: http://localhost:5000/api/predict")
    print("💊 Health Check: http://localhost:5000/api/health")
    print()
    print("📋 How to use your PKL model:")
    print("1. The system will automatically try to load 'ensemble_model.pkl'")
    print("2. Or save your trained model as 'model.pkl' in the same directory")
    print("3. Or use the /api/load_model endpoint to upload your model")
    print("4. The predictor will automatically use your model for predictions")
    print()

    # Get port from environment variable for Render deployment
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
