export default function Results({
  detections,
  conf,
  inferTime,
  history,
  onLoadHistory
}) {
  const crops = detections.filter(d => d.class_name === "crop").length;
  const weeds = detections.filter(d => d.class_name === "weed").length;

  return (
    <div className="results">

      {/* ───────────────────────── HEADER ───────────────────────── */}
      <div className="r-head">
        <h2>Inference results</h2>
      </div>

      {/* ───────────────────────── METRICS GRID ───────────────────────── */}
      <div className="metric-grid">

        <div className="metric">
          <div className="lbl">Total detections</div>
          <div className="val">{detections.length}</div>
        </div>

        <div className="metric">
          <div className="lbl">Inference time</div>
          <div className="val">
            {inferTime ? inferTime.toFixed(2) + " ms" : "--"}
          </div>
        </div>

        <div className="metric crop">
          <div className="lbl">Crops</div>
          <div className="val">{crops}</div>
        </div>

        <div className="metric weed">
          <div className="lbl">Weeds</div>
          <div className="val">{weeds}</div>
        </div>

      </div>

      {/* ───────────────────────── DETECTION LIST ───────────────────────── */}
      <div className="det-list">
        {detections.length === 0 ? (
          <div className="det-empty">
            <svg width="32" height="32" stroke="currentColor" strokeWidth="1.5" fill="none">
              <circle cx="16" cy="16" r="12" />
              <path d="M12 16h8" />
            </svg>
            No detections yet
          </div>
        ) : (
          detections.map((d) => (
            <div className="det-item" key={d.id}>
              <span className={`det-dot ${d.class_name}`} />

              <div className="det-body">
                <div className="det-name">
                  {d.class_name} #{d.id}
                </div>

                <div
                  className={`det-bar ${d.class_name}`}
                  style={{ width: `${d.confidence * 100}%` }}
                />
              </div>

              <span className="det-conf">
                {Math.round(d.confidence * 100)}%
              </span>
            </div>
          ))
        )}
      </div>

      {/* ───────────────────────── HISTORY ───────────────────────── */}
      <div className="history-section">
        <div className="sec-label">Recent runs</div>

        {history.length === 0 && (
          <div className="det-empty">No history yet</div>
        )}

        {history.map((h, index) => (
          <div
            key={index}
            className="hist-item"
            onClick={() => onLoadHistory(h)}
          >
            <div className="hist-thumb">
              {h.thumb && <img src={h.thumb} alt="" />}
            </div>

            <div className="hist-info">
              <div className="hist-name">{h.name}</div>
              <div className="hist-time">{h.label}</div>
            </div>

            <span className="hist-badge">
              {h.crops}C {h.weeds}W
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
