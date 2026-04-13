"""
Flask Web Server — Cardiovascular Disease Risk Prediction
Each route defined exactly once (original had tripled imports/routes).
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from heart_disease_backend import HeartDiseasePredictor

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

predictor = HeartDiseasePredictor()


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/<path:filename>')
def serve_static(filename):
    return app.send_static_file(filename)


@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    # Map frontend keys → backend keys
    # Frontend sends human-friendly values; backend converts internally.
    raw = {
        "age":        data.get('age'),          # years (int)
        "gender":     data.get('gender'),        # "Male" / "Female"
        "height":     data.get('height'),        # cm
        "weight":     data.get('weight'),        # kg
        "ap_hi":      data.get('ap_hi'),         # systolic mmHg
        "ap_lo":      data.get('ap_lo'),         # diastolic mmHg
        "cholesterol": data.get('cholesterol'),  # 1/2/3
        "gluc":       data.get('gluc'),          # 1/2/3
        "smoke":      data.get('smoke'),         # 0/1
        "alco":       data.get('alco'),          # 0/1
        "active":     data.get('active'),        # 0/1
    }

    required = ["age", "height", "weight", "ap_hi", "ap_lo"]
    for f in required:
        if raw.get(f) is None:
            return jsonify({"error": f"Missing required field: {f}"}), 400

    try:
        result = predictor.predict_risk(raw)
        return jsonify(result)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "model_loaded": predictor.model is not None})


@app.route('/api/default_values')
def default_values():
    try:
        return jsonify({"status": "success", "default_values": predictor.get_default_values()})
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 500


@app.route('/api/load_model', methods=['POST'])
def load_model():
    if 'model_file' not in request.files:
        return jsonify({"error": "No model file provided"}), 400
    f = request.files['model_file']
    if not f.filename.endswith('.pkl'):
        return jsonify({"error": "Please upload a .pkl file"}), 400
    try:
        path = 'uploaded_model.pkl'
        f.save(path)
        predictor.load_model(path)
        return jsonify({"message": "Model loaded successfully"})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Cardiovascular Risk server on port {port}")
    print(f"Model loaded: {predictor.model is not None}")
    app.run(host='0.0.0.0', port=port, debug=False)
