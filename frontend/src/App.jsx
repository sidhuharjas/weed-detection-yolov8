import { useState, useEffect, useCallback } from 'react';

import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import Results from './components/Results';
import Toolbar from './components/Toolbar';
import ExportBar from './components/ExportBar';
import Timeline from './components/Timeline';

import './global.css';

// Correct backend URL
const BACKEND = "https://weeddetector2-2.onrender.com";

export default function App() {
  // Settings
  const [conf, setConf] = useState(0.45);
  const [iou, setIou] = useState(0.45);
  const [sliceSize, setSliceSize] = useState(512);
  const [overlap, setOverlap] = useState(0.20);
  const [useSahi, setUseSahi] = useState(true);
  const [modelArch, setModelArch] = useState("yolov8m");

  // Toggles
  const [showBoxes, setShowBoxes] = useState(true);
  const [showConf, setShowConf] = useState(true);
  const [weedsOnly, setWeedsOnly] = useState(false);
  const [showHeat, setShowHeat] = useState(false);
  const [heatOpacity, setHeatOpacity] = useState(0.55);

  // App state
  const [file, setFile] = useState(null);
  const [imgEl, setImgEl] = useState(null);
  const [detections, setDetections] = useState([]);
  const [annotatedSrc, setAnnotatedSrc] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [backendOk, setBackendOk] = useState(false);
  const [inferTime, setInferTime] = useState(null);
  const [tab, setTab] = useState("image");
  const [history, setHistory] = useState([]);
  const [histStats, setHistStats] = useState([]);
  const [progress, setProgress] = useState(0);

  // Simple backend check using root route
  const checkBackend = useCallback(async () => {
    try {
      const r = await fetch(BACKEND + "/", { signal: AbortSignal.timeout(3000) });
      setBackendOk(r.ok);
    } catch {
      setBackendOk(false);
    }
  }, []);

  useEffect(() => {
    checkBackend();
    const id = setInterval(checkBackend, 8000);
    return () => clearInterval(id);
  }, [checkBackend]);

  // Handle file upload
  const handleFile = useCallback((f) => {
    setError("");
    if (!f || !/^image\//.test(f.type)) {
      setError("Invalid file type.");
      return;
    }

    setFile(f);
    setDetections([]);
    setAnnotatedSrc(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => setImgEl(img);
      img.src = e.target.result;
    };
    reader.readAsDataURL(f);
  }, []);

  // Run inference
  const runInference = useCallback(async () => {
    if (!file || running) return;

    setRunning(true);
    setError("");
    setProgress(30);
    setTab("image");

    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("conf", conf.toFixed(2));
      fd.append("iou", iou.toFixed(2));
      fd.append("slice_size", sliceSize);
      fd.append("overlap", overlap.toFixed(2));

      // If backend is offline, use mock mode
      if (!backendOk) {
        setTimeout(() => {
          setProgress(100);
          const mock = [
            { id: 1, class_name: "crop", confidence: 0.92, bbox: [50, 50, 100, 100] },
            { id: 2, class_name: "weed", confidence: 0.85, bbox: [200, 150, 80, 80] }
          ];
          setDetections(mock);
          setInferTime(120.5);
          setHistStats(prev => [...prev.slice(-9), { crops: 1, weeds: 1, label: new Date().toLocaleTimeString() }]);
          setRunning(false);
        }, 1500);
        return;
      }

      // Real backend inference
      const resp = await fetch(BACKEND + "/predict", {
        method: "POST",
        body: fd,
        signal: AbortSignal.timeout(120000),
      });

      if (!resp.ok) throw new Error("Server error");

      const data = await resp.json();
      setProgress(100);
      setDetections(data.detections || []);
      setAnnotatedSrc(data.annotated_image);
      setInferTime(data.inference_time);

      if (data.annotated_image) {
        const img = new Image();
        img.onload = () => setImgEl(img);
        img.src = data.annotated_image;
      }

      const crops = data.detections.filter(d => d.class_name === "crop").length;
      const weeds = data.detections.filter(d => d.class_name === "weed").length;
      const label = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setHistStats(prev => [...prev.slice(-9), { crops, weeds, label }]);
      setHistory(prev => [{
        name: file.name,
        label,
        crops,
        weeds,
        thumb: data.annotated_image || imgEl?.src,
        dets: data.detections,
        annotated: data.annotated_image,
      }, ...prev.slice(0, 4)]);

    } catch (err) {
      setError("Inference failed: " + err.message);
    } finally {
      setRunning(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [file, running, conf, iou, sliceSize, overlap, backendOk, imgEl]);

  return (
    <div className="app">
      <Sidebar
        conf={conf} setConf={setConf}
        iou={iou} setIou={setIou}
        sliceSize={sliceSize} setSliceSize={setSliceSize}
        overlap={overlap} setOverlap={setOverlap}
        useSahi={useSahi} setUseSahi={setUseSahi}
        modelArch={modelArch} setModelArch={setModelArch}
        showBoxes={showBoxes} setShowBoxes={setShowBoxes}
        showConf={showConf} setShowConf={setShowConf}
        weedsOnly={weedsOnly} setWeedsOnly={setWeedsOnly}
        showHeat={showHeat} setShowHeat={setShowHeat}
        heatOpacity={heatOpacity} setHeatOpacity={setHeatOpacity}
        file={file} onFile={handleFile}
        running={running} onRun={runInference}
        backendOk={backendOk} error={error}
      />

      <div className="main">
        <div className="upload-top">
          <label className="drop-zone" style={{ flex: 1 }}>
            <input type="file" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            {file ? file.name : "Click to Upload Image"}
          </label>

          <button className="btn" style={{ width: "auto", marginTop: 0 }} disabled={!file || running} onClick={runInference}>
            {running ? "Running..." : "Run Inference"}
          </button>
        </div>

        <Toolbar tab={tab} setTab={setTab} />

        {tab === "image" ? (
          <Canvas
            imgEl={imgEl}
            detections={detections}
            conf={conf}
            showBoxes={showBoxes}
            showConf={showConf}
            weedsOnly={weedsOnly}
            loading={running}
            progress={progress}
            progressText="Running Model..."
          />
        ) : (
          <Timeline historyStats={histStats} />
        )}

        <ExportBar detections={detections} annotatedSrc={annotatedSrc} file={file} disabled={!detections.length} />
      </div>

      <Results
        detections={detections}
        conf={conf}
        inferTime={inferTime}
        history={history}
        onLoadHistory={(h) => {
          setDetections(h.dets);
          setAnnotatedSrc(h.annotated);
          setTab("image");
        }}
      />
    </div>
  );
}
