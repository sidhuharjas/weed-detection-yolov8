# AgroVision — Setup Guide

## What you need
- Python 3.9+
- Your trained YOLOv8 `.pt` file

---

## Step 1 — Install dependencies

```bash
pip install flask flask-cors ultralytics sahi opencv-python-headless pillow numpy
```

---

## Step 2 — Put your model in

Open `app.py` and change line 10:

```python
MODEL_PATH = "best.pt"   # <-- your .pt file path here
```

Also update the class names to match your model (line 11):

```python
CLASS_NAMES = {
    0: "crop",
    1: "weed",
}
```

- Class names **must** be `"crop"` or `"weed"` for the UI colors to work correctly.
- If your model has different class IDs, just map them: `{0: "weed", 1: "crop"}`.

---

## Step 3 — Start the backend

```bash
python app.py
```

You should see:
```
[AgroVision] Loading model: best.pt
[AgroVision] SAHI + YOLOv8 model loaded.
[AgroVision] Server running at http://0.0.0.0:5000
```

---

## Step 4 — Open the UI

Open `index.html` in your browser (double-click it, or drag it into Chrome/Firefox).

The status indicator in the top-right of the sidebar will turn green when the backend is connected.

---

## Optional — disable SAHI

If you want faster inference without SAHI slicing, open `app.py` and set:

```python
USE_SAHI = False
```

---

## Optional — use GPU

In `app.py`, change:

```python
device="cpu"
```
to:
```python
device="cuda:0"
```

---

## Files

| File | What it does |
|---|---|
| `app.py` | Flask backend — loads your YOLO model, runs SAHI inference, returns results |
| `index.html` | Frontend UI — open this in your browser |

---

## Troubleshooting

**"Backend offline"** — make sure `python app.py` is running in a terminal.

**"Model not loaded"** — check that `MODEL_PATH` points to a valid `.pt` file.

**CORS error in browser** — this is handled by flask-cors. If you see it, re-run `pip install flask-cors`.

**Slow inference** — reduce SAHI slice size in the UI, or set `USE_SAHI = False` in `app.py`.
