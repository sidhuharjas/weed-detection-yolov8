export default function Toolbar({ tab, setTab }) {
  return (
    <div className="toolbar">
      <span className="toolbar-title">Detection canvas</span>

      <button
        className={`tab ${tab === "image" ? "active" : ""}`}
        onClick={() => setTab("image")}
      >
        Image
      </button>

      <button
        className={`tab ${tab === "timeline" ? "active" : ""}`}
        onClick={() => setTab("timeline")}
      >
        Timeline
      </button>
    </div>
  )
}
