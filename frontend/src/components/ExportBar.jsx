export default function ExportBar({ detections, annotatedSrc, file, disabled }) {
  
  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(detections, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `detections_${file?.name || 'export'}.json`);
    dlAnchorElem.click();
  };

  const downloadCSV = () => {
    let csv = "id,class_name,confidence,x,y,w,h\n";
    detections.forEach(d => {
      const bbox = d.bbox ? d.bbox.join(',') : ",,,";
      csv += `${d.id},${d.class_name},${d.confidence},${bbox}\n`;
    });
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `detections_${file?.name || 'export'}.csv`);
    dlAnchorElem.click();
  };

  const downloadAnnotated = () => {
    if (!annotatedSrc) return;
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", annotatedSrc);
    dlAnchorElem.setAttribute("download", `annotated_${file?.name || 'image'}.jpg`);
    dlAnchorElem.click();
  };

  return (
    <div className="export-bar">
      <button className="btn" onClick={downloadAnnotated} disabled={disabled || !annotatedSrc} style={{marginTop: 0}}>
        Annotated Image
      </button>
      <button className="btn" onClick={downloadJSON} disabled={disabled} style={{marginTop: 0}}>
        JSON
      </button>
      <button className="btn" onClick={downloadCSV} disabled={disabled} style={{marginTop: 0}}>
        CSV
      </button>
    </div>
  )
}