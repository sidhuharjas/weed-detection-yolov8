import { useRef, useEffect } from "react";

export default function Canvas({
  imgEl, detections, conf, showBoxes, showConf, weedsOnly,
  loading, progress, progressText
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !imgEl) return;
    
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = imgEl.width;
    canvasRef.current.height = imgEl.height;
    
    // Draw base image
    ctx.drawImage(imgEl, 0, 0);

    // Draw detections
    if (showBoxes) {
      detections.forEach(d => {
        if (weedsOnly && d.class_name !== "weed") return;
        if (d.confidence < conf) return;
        if (!d.bbox) return; // Ensure bbox [x, y, w, h] exists

        const [x, y, w, h] = d.bbox;
        const color = d.class_name === "weed" ? "#eb4d4b" : "#6ab04c";
        
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, imgEl.width / 300);
        ctx.strokeRect(x, y, w, h);

        if (showConf) {
          ctx.fillStyle = color;
          ctx.font = `${Math.max(12, imgEl.width / 50)}px Arial`;
          ctx.fillText(`${d.class_name} ${Math.round(d.confidence * 100)}%`, x, y - 5);
        }
      });
    }
  }, [imgEl, detections, conf, showBoxes, showConf, weedsOnly]);

  return (
    <div className="canvas-area">
      {!imgEl && (
        <div className="placeholder">
          <svg width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none">
            <path d="M4 16v10a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V16" />
            <path d="M12 12l4-4 4 4" />
            <path d="M16 8v18" />
          </svg>
          <p>Upload an image and run inference to see detections</p>
        </div>
      )}

      {imgEl && (
        <div className="canvas-wrap">
          <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />

          {loading && (
            <div className="inf-overlay show">
              <div className="spinner" />
              <div className="inf-text" style={{ color: 'white', marginTop: '10px' }}>
                {progressText}
              </div>
              <div className="inf-bar-wrap">
                <div className="inf-bar" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}