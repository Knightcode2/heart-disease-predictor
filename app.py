"""
Flask Web Server for Heart Disease Prediction
Serves the web application and provides API endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from heart_disease_backend import HeartDiseasePredictor

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Initialize predictor
"""
Flask Web Server for Heart Disease Prediction
Serves the web application and provides API endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from heart_disease_backend import HeartDiseasePredictor

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Initialize predictor
predictor = HeartDiseasePredictor()


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/<path:filename>')
def serve_static(filename):
    return app.send_static_file(filename)


"""
Flask Web Server for Heart Disease Prediction
Serves the web application and provides API endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from heart_disease_backend import HeartDiseasePredictor

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Initialize predictor
predictor = HeartDiseasePredictor()


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/<path:filename>')
def serve_static(filename):
    return app.send_static_file(filename)


@app.route('/api/predict', methods=['POST'])
def predict_heart_disease():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Map frontend to backend keys
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

    # basic required check
    required = ["Age", "Gender", "Cholesterol", "Blood Pressure", "Heart Rate"]
    for r in required:
        if input_data.get(r) is None:
            return jsonify({"error": f"Missing required field: {r}"}), 400

    try:
        res = predictor.predict_risk(input_data)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "model_loaded": predictor.model is not None})


@app.route('/api/default_values')
def default_values():
    try:
        return jsonify({"status": "success", "default_values": predictor.get_default_values()})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/load_model', methods=['POST'])
def load_model():
    try:
        if 'model_file' not in request.files:
            return jsonify({"error": "No model file provided"}), 400

        file = request.files['model_file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        if file and file.filename.endswith('.pkl'):
            filename = 'uploaded_model.pkl'
            file.save(filename)
            predictor.load_model(filename)
            return jsonify({"message": "Model loaded successfully"})
        else:
            return jsonify({"error": "Please upload a .pkl file"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
