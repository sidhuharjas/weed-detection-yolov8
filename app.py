"""
AgroVision Backend — YOLOv8 + SAHI
===================================
SETUP:
  pip install flask flask-cors ultralytics sahi opencv-python-headless pillow numpy
"""

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
import os

# Fix for libGL.so.1 missing on headless servers (Render, Streamlit Cloud, etc.)
os.environ["OPENCV_IO_ENABLE_OPENEXR"] = "0"
os.environ["QT_QPA_PLATFORM"] = "offscreen"

MODEL_PATH = "best.pt"

CLASS_NAMES = {
    0: "crop",
    1: "weed",
}

DEFAULT_CONF        = 0.45
DEFAULT_SLICE_SIZE  = 512
DEFAULT_OVERLAP     = 0.20
DEFAULT_IOU         = 0.45
USE_SAHI            = True

HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", 5000))


# ─────────────────────────────────────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────────────────────────────────────

import io, base64, time
import numpy as np
from PIL import Image, ImageDraw
from flask import Flask, request, jsonify
from flask_cors import CORS

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def to_py(o):
    """Convert NumPy types → Python types for JSON serialization."""
    if isinstance(o, (np.float32, np.float64)):
        return float(o)
    if isinstance(o, (np.int32, np.int64)):
        return int(o)
    return o

# ─────────────────────────────────────────────────────────────────────────────
# APP INIT
# ─────────────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────────────────────────────────────
# LOAD MODEL (lazy — safe for gunicorn multi-worker)
# ─────────────────────────────────────────────────────────────────────────────

detection_model = None

def load_model():
    global detection_model
    if detection_model is not None:
        return detection_model

    print(f"[AgroVision] Loading model: {MODEL_PATH}")
    try:
        if USE_SAHI:
            from sahi import AutoDetectionModel
            detection_model = AutoDetectionModel.from_pretrained(
                model_type="yolov8",
                model_path=MODEL_PATH,
                confidence_threshold=DEFAULT_CONF,
                device="cpu",
            )
            print("[AgroVision] SAHI + YOLOv8 model loaded.")
        else:
            from ultralytics import YOLO
            detection_model = YOLO(MODEL_PATH)
            print("[AgroVision] YOLOv8 model loaded (no SAHI).")
    except Exception as e:
        detection_model = None
        print(f"[AgroVision] ERROR: Failed to load model — {e}")

    return detection_model


# Load on startup (works for both direct run and gunicorn)
with app.app_context():
    load_model()


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def root():
    return jsonify({"status": "AgroVision online", "model": MODEL_PATH})


@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "online": detection_model is not None,
        "model": MODEL_PATH
    })


@app.route("/predict", methods=["POST"])
def predict():
    model = load_model()

    if model is None:
        return jsonify({"error": f"Model not loaded. Check MODEL_PATH = '{MODEL_PATH}'"}), 500

    if "image" not in request.files:
        return jsonify({"error": "No image file provided."}), 400

    # Read parameters
    file        = request.files["image"]
    conf        = float(request.form.get("conf",        DEFAULT_CONF))
    slice_size  = int(  request.form.get("slice_size",  DEFAULT_SLICE_SIZE))
    overlap     = float(request.form.get("overlap",     DEFAULT_OVERLAP))
    iou         = float(request.form.get("iou",         DEFAULT_IOU))

    # Load image
    image = Image.open(file.stream).convert("RGB")
    W, H  = image.size
    t0    = time.time()

    detections = []

    # ─────────────────────────────────────────────────────────────────────
    # INFERENCE
    # ─────────────────────────────────────────────────────────────────────
    if USE_SAHI:
        from sahi.predict import get_sliced_prediction
        result = get_sliced_prediction(
            image,
            model,
            slice_height=slice_size,
            slice_width=slice_size,
            overlap_height_ratio=overlap,
            overlap_width_ratio=overlap,
            postprocess_type="NMS",
            postprocess_match_threshold=iou,
        )

        for obj in result.object_prediction_list:
            if obj.score.value < conf:
                continue

            box = obj.bbox
            cls = obj.category.id

            detections.append({
                "id": len(detections) + 1,
                "class_id": cls,
                "class_name": CLASS_NAMES.get(cls, f"class_{cls}"),
                "confidence": to_py(obj.score.value),
                "x": to_py(box.minx / W),
                "y": to_py(box.miny / H),
                "w": to_py((box.maxx - box.minx) / W),
                "h": to_py((box.maxy - box.miny) / H),
            })

    else:
        results = model(image, conf=conf, iou=iou)
        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                x1, y1, x2, y2 = box.xyxy[0].tolist()

                detections.append({
                    "id": len(detections) + 1,
                    "class_id": cls,
                    "class_name": CLASS_NAMES.get(cls, f"class_{cls}"),
                    "confidence": to_py(float(box.conf[0])),
                    "x": to_py(x1 / W),
                    "y": to_py(y1 / H),
                    "w": to_py((x2 - x1) / W),
                    "h": to_py((y2 - y1) / H),
                })

    elapsed = to_py(time.time() - t0)

    # ─────────────────────────────────────────────────────────────────────
    # ANNOTATED IMAGE
    # ─────────────────────────────────────────────────────────────────────
    annotated = image.copy()
    draw = ImageDraw.Draw(annotated)
    COLORS = {"crop": "#639922", "weed": "#E24B4A"}

    for d in detections:
        color = COLORS.get(d["class_name"], "#888888")
        x1 = d["x"] * W
        y1 = d["y"] * H
        x2 = x1 + d["w"] * W
        y2 = y1 + d["h"] * H

        draw.rectangle([x1, y1, x2, y2], outline=color, width=2)
        label = f"{d['class_name']} {int(d['confidence']*100)}%"
        draw.rectangle([x1, y1 - 14, x1 + len(label) * 6 + 6, y1], fill=color)
        draw.text((x1 + 3, y1 - 13), label, fill="white")

    buf = io.BytesIO()
    annotated.save(buf, format="JPEG", quality=90)
    annotated_b64 = base64.b64encode(buf.getvalue()).decode()

    return jsonify({
        "detections": detections,
        "annotated_image": f"data:image/jpeg;base64,{annotated_b64}",
        "inference_time": elapsed,
        "image_width": to_py(W),
        "image_height": to_py(H),
        "model": MODEL_PATH,
        "conf_threshold": to_py(conf),
        "slice_size": to_py(slice_size),
        "overlap": to_py(overlap),
        "sahi_enabled": USE_SAHI,
    })


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"[AgroVision] Server running at http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT)
