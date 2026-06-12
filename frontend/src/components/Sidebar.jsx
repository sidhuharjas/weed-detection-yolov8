export default function Sidebar({
  conf, setConf,
  iou, setIou,
  sliceSize, setSliceSize,
  overlap, setOverlap,
  useSahi, setUseSahi,
  modelArch, setModelArch,
  showBoxes, setShowBoxes,
  showConf, setShowConf,
  weedsOnly, setWeedsOnly,
  showHeat, setShowHeat,
  heatOpacity, setHeatOpacity,
  file, onFile,
  running, onRun,
  backendOk, error
}) {
  return (
    <div className="sidebar">

      <div className="s-head">
        <h1>AgroVision</h1>

        <div className="status">
          <span className={`dot ${backendOk ? "online" : "offline"}`} />
          <span>{backendOk ? "Backend online" : "Backend offline"}</span>
        </div>
      </div>

      <div className="section">
        <div className="sec-label">Input</div>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFile(e.target.files[0])}
        />

        {file && (
          <div className="file-pill show">
            <span>{file.name}</span>
          </div>
        )}

        <button
          className="btn btn-run"
          disabled={!file || running}
          onClick={onRun}
        >
          Run inference
        </button>

        {error && <div className="error">{error}</div>}
      </div>

      {/* Model Settings */}
      <div className="section">
        <div className="sec-label">Model Architecture</div>

        <select
          value={modelArch}
          onChange={(e) => setModelArch(e.target.value)}
        >
          <option value="yolov8n">YOLOv8n</option>
          <option value="yolov8s">YOLOv8s</option>
          <option value="yolov8m">YOLOv8m</option>
          <option value="yolov8l">YOLOv8l</option>
          <option value="yolov8x">YOLOv8x</option>
        </select>
      </div>

      {/* Confidence */}
      <div className="section">
        <div className="sec-label">Confidence: {conf.toFixed(2)}</div>
        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.01"
          value={conf}
          onChange={(e) => setConf(parseFloat(e.target.value))}
        />
      </div>

      {/* IoU */}
      <div className="section">
        <div className="sec-label">IoU: {iou.toFixed(2)}</div>
        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.01"
          value={iou}
          onChange={(e) => setIou(parseFloat(e.target.value))}
        />
      </div>

      {/* Slice Size */}
      <div className="section">
        <div className="sec-label">Slice Size: {sliceSize}px</div>
        <input
          type="range"
          min="256"
          max="1024"
          step="64"
          value={sliceSize}
          onChange={(e) => setSliceSize(parseInt(e.target.value))}
        />
      </div>

      {/* Overlap */}
      <div className="section">
        <div className="sec-label">Overlap: {overlap.toFixed(2)}</div>
        <input
          type="range"
          min="0.0"
          max="0.9"
          step="0.01"
          value={overlap}
          onChange={(e) => setOverlap(parseFloat(e.target.value))}
        />
      </div>

      {/* SAHI Toggle */}
      <div className="section">
        <label>
          <input
            type="checkbox"
            checked={useSahi}
            onChange={(e) => setUseSahi(e.target.checked)}
          />
          Use SAHI slicing
        </label>
      </div>

    </div>
  );
}
