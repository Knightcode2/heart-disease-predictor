"""
Cardiovascular Risk — Flask Web Server
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import CardioPredictor

app       = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)
predictor = CardioPredictor()


# ── Static ────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return app.send_static_file("index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return app.send_static_file(filename)


# ── API ───────────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "model_loaded": predictor.is_loaded()})


@app.route("/api/defaults")
def defaults():
    return jsonify(predictor.default_values())


@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No JSON body received"}), 400

    required = ["age_years", "gender", "height", "weight", "ap_hi", "ap_lo"]
    for field in required:
        if data.get(field) is None:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    result = predictor.predict(data)
    if "error" in result:
        return jsonify(result), 500
    return jsonify(result)


@app.route("/api/load_model", methods=["POST"])
def load_model():
    if "model_file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    f = request.files["model_file"]
    if not f.filename.endswith(".pkl"):
        return jsonify({"error": "File must be a .pkl file"}), 400
    save_path = "uploaded_model.pkl"
    f.save(save_path)
    try:
        predictor.load_model(save_path)
        return jsonify({"message": "Model loaded successfully"})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── Entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
