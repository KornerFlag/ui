/* Korner Flags UI kit — shared primitives. */

// --- Logo lockup ---
function Logo({ dark = false, size = 34, sub = true }) {
  const markColor = dark ? "var(--steel-400)" : "var(--steel-600)";
  const wordColor = dark ? "#fff" : "var(--ink-800)";
  const subColor = dark ? "var(--fg-on-ink-soft)" : "var(--slate-400)";
  return (
    <div className="row center" style={{ gap: 11 }}>
      <span style={{ color: markColor, display: "flex" }}>
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <rect x="13" y="6" width="3" height="36" rx="1.5" fill="currentColor"/>
          <path d="M16 8.5 L37 14.2 C38.2 14.5 38.2 16.2 37 16.5 L16 22.2 Z" fill="currentColor"/>
          <circle cx="14.5" cy="42" r="3.2" fill="currentColor"/>
        </svg>
      </span>
      <span>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: size * 0.66, letterSpacing: "-.02em", lineHeight: 1, color: wordColor, whiteSpace: "nowrap" }}>Korner Flags</div>
        {sub && <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", marginTop: 3, color: subColor }}>Match analysis</div>}
      </span>
    </div>
  );
}

// --- Soccer pitch line work (reusable data-viz base) ---
function PitchLines({ stroke = "rgba(255,255,255,.18)", vertical = false }) {
  // horizontal pitch (touchline along long axis)
  return (
    <svg className="pitch-svg" viewBox="0 0 300 190" preserveAspectRatio="none" fill="none" stroke={stroke} strokeWidth="1">
      <rect x="6" y="6" width="288" height="178" rx="3"/>
      <line x1="150" y1="6" x2="150" y2="184"/>
      <circle cx="150" cy="95" r="26"/>
      <circle cx="150" cy="95" r="1.6" fill={stroke} stroke="none"/>
      <rect x="6" y="50" width="42" height="90"/>
      <rect x="6" y="72" width="16" height="46"/>
      <rect x="252" y="50" width="42" height="90"/>
      <rect x="278" y="72" width="16" height="46"/>
    </svg>
  );
}

// --- Heatmap pitch: lines + soft heat blobs ---
function HeatPitch({ blobs, label }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "linear-gradient(160deg,#0E1A2B,#16273D)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        {blobs.map((b, i) => (
          <div key={i} style={{
            position: "absolute", left: b.x + "%", top: b.y + "%",
            width: b.r, height: b.r, transform: "translate(-50%,-50%)",
            borderRadius: "50%", filter: "blur(14px)",
            background: `radial-gradient(circle, ${b.c} 0%, transparent 70%)`,
            opacity: b.o ?? 0.85,
          }}/>
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: 0.9 }}><PitchLines stroke="rgba(255,255,255,.16)"/></div>
      {label && <div style={{ position: "absolute", left: 14, bottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(255,255,255,.8)" }}>{label}</div>}
    </div>
  );
}

// --- Video frame placeholder (the product hero) ---
function VideoFrame({ children, playing, onToggle, tall }) {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: tall ? "16/10" : "16/9", background: "linear-gradient(150deg,#0B1626,#1A2C44)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-ink)" }}>
      {/* faint pitch context */}
      <div style={{ position: "absolute", inset: "8% 6%", opacity: 0.5 }}><PitchLines stroke="rgba(122,160,210,.22)"/></div>
      {/* HINT: replace this block with real match footage <video> / poster image */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <button onClick={onToggle} aria-label="Play"
          style={{ width: 72, height: 72, borderRadius: "50%", border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.12)", backdropFilter: "blur(4px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.22)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}>
          <Icon name={playing ? "pause" : "play"} size={26} stroke={1.8} style={{ marginLeft: playing ? 0 : 3 }}/>
        </button>
      </div>
      {children}
    </div>
  );
}

// --- Stat card ---
function StatCard({ label, value, unit, sub, icon, accent }) {
  return (
    <div className="card card-pad">
      <div className="row center" style={{ gap: 7, color: accent ? "var(--steel-600)" : "var(--slate-400)" }}>
        {icon && <Icon name={icon} size={15} stroke={2.2}/>}
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--slate-400)" }}>{label}</span>
      </div>
      <div className="stat-num" style={{ fontSize: 32, marginTop: 12 }}>
        {value}{unit && <span style={{ fontSize: 16, color: "var(--fg-3)" }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// --- Status badge helper ---
function StatusBadge({ status }) {
  const map = {
    Ready: "badge-ready", Processing: "badge-processing", Draft: "badge-draft",
  };
  return (
    <span className={"badge " + (map[status] || "badge-draft")}>
      <span className="dot" style={{ background: "currentColor" }}/>{status}
    </span>
  );
}

// --- Section eyebrow + heading ---
function SectionHead({ eyebrow, title, sub, center, light }) {
  return (
    <div className="col" style={{ gap: 12, textAlign: center ? "center" : "left", alignItems: center ? "center" : "flex-start", maxWidth: center ? 640 : "none", margin: center ? "0 auto" : 0 }}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 32, letterSpacing: "-.02em", lineHeight: 1.12, margin: 0, color: light ? "#fff" : "var(--fg-1)" }}>{title}</h2>
      {sub && <p style={{ fontSize: 17, lineHeight: 1.55, margin: 0, color: light ? "var(--fg-on-ink-soft)" : "var(--fg-3)" }}>{sub}</p>}
    </div>
  );
}

Object.assign(window, { Logo, PitchLines, HeatPitch, VideoFrame, StatCard, StatusBadge, SectionHead });
