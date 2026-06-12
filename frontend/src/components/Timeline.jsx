import { useEffect, useRef } from "react";

export default function Timeline({ historyStats }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || historyStats.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth || 600;
    canvas.height = 300;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const maxVal = Math.max(...historyStats.map(h => h.crops + h.weeds), 10);
    const barWidth = (canvas.width / historyStats.length) - 20;

    historyStats.forEach((stat, i) => {
      const x = i * (barWidth + 20) + 10;
      
      // Weeds Bar (Red)
      const weedHeight = (stat.weeds / maxVal) * canvas.height;
      ctx.fillStyle = '#eb4d4b';
      ctx.fillRect(x, canvas.height - weedHeight, barWidth / 2, weedHeight);

      // Crops Bar (Green)
      const cropHeight = (stat.crops / maxVal) * canvas.height;
      ctx.fillStyle = '#6ab04c';
      ctx.fillRect(x + (barWidth / 2), canvas.height - cropHeight, barWidth / 2, cropHeight);
      
      // Label
      ctx.fillStyle = '#888';
      ctx.font = '10px Arial';
      ctx.fillText(stat.label, x, canvas.height - Math.max(weedHeight, cropHeight) - 10);
    });
  }, [historyStats]);

  return (
    <div id="timelineWrap">
      <canvas id="timelineCanvas" ref={canvasRef} style={{ width: '100%', height: '300px' }} />
      <p className="timeline-caption">Weed (Red) and Crop (Green) count per inference run</p>
    </div>
  );
}