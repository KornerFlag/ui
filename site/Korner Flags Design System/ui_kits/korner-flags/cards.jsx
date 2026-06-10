/* Korner Flags UI kit — composite cards (match, package, roadmap). */

function MiniPitch({ blobs }) {
  const D = window.KF_DATA;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: "14% 10%", opacity: .6 }}><PitchLines stroke="rgba(255,255,255,.18)"/></div>
      {blobs && (D.heatBlobs[blobs] || []).slice(0, 4).map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.x + "%", top: b.y + "%", width: b.r * 0.7, height: b.r * 0.7, transform: "translate(-50%,-50%)", borderRadius: "50%", filter: "blur(10px)", background: `radial-gradient(circle, ${b.c} 0%, transparent 70%)`, opacity: (b.o ?? .85) * .8 }}/>
      ))}
    </div>
  );
}

function MatchCard({ m, go }) {
  const ready = m.status === "Ready";
  return (
    <div className="card card-hover" style={{ overflow: "hidden", cursor: ready ? "pointer" : "default", display: "flex", flexDirection: "column" }}
      onClick={() => ready && go("/analysis/" + m.id)}>
      <div style={{ position: "relative", height: 132, background: "linear-gradient(150deg,#0E1A2B,#1F344F)" }}>
        <MiniPitch blobs={m.heat ? m.blobs : null}/>
        {/* HINT: replace with real match thumbnail image */}
        <div style={{ position: "absolute", top: 12, left: 12 }}><StatusBadge status={m.status}/></div>
        {ready && <div style={{ position: "absolute", right: 12, bottom: 12, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", backdropFilter: "blur(4px)" }}><Icon name="play" size={15} style={{ marginLeft: 2 }}/></div>}
      </div>
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--steel-600)" }}>{m.label}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, letterSpacing: "-.01em", color: "var(--fg-1)", marginTop: 4 }}>{m.title}</div>
        <div className="row center" style={{ gap: 8, marginTop: 5, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-4)" }}>
          <Icon name="calendar" size={13}/>{m.date}<span style={{ opacity: .5 }}>·</span><Icon name="clock" size={13}/>{m.duration}
        </div>
        <div className="row" style={{ gap: 18, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-soft)" }}>
          {[["Poss", m.possession[0] + "/" + m.possession[1]], ["Passes", m.passes], ["Dist", m.distance.replace(" km", "km")]].map(([l, v]) => (
            <div key={l} className="col" style={{ gap: 1 }}>
              <span className="stat-num" style={{ fontSize: 15 }}>{v}</span>
              <span style={{ fontSize: 10, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--fg-4)" }}>{l}</span>
            </div>
          ))}
          <div className="grow"/>
          {ready
            ? <button className="btn btn-secondary btn-sm" style={{ alignSelf: "center" }} onClick={(e) => { e.stopPropagation(); go("/analysis/" + m.id); }}>Open</button>
            : <span style={{ alignSelf: "center", fontSize: 12, color: "var(--fg-4)", fontWeight: 600 }}>{m.status === "Processing" ? "Analyzing…" : "Draft"}</span>}
        </div>
      </div>
    </div>
  );
}

function MatchRow({ m, go }) {
  const ready = m.status === "Ready";
  return (
    <tr style={{ borderBottom: "1px solid var(--border-soft)", cursor: ready ? "pointer" : "default", transition: "background .15s" }}
      onClick={() => ready && go("/analysis/" + m.id)}
      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-1)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <td style={{ padding: "12px 14px" }}>
        <div className="row center" style={{ gap: 13 }}>
          <div style={{ width: 64, height: 40, borderRadius: 6, position: "relative", overflow: "hidden", background: "linear-gradient(150deg,#0E1A2B,#1F344F)", flex: "none" }}><MiniPitch blobs={m.heat ? m.blobs : null}/></div>
          <div className="col" style={{ gap: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--fg-1)" }}>{m.title}</span>
            <span style={{ fontSize: 12, color: "var(--fg-4)" }}>{m.label}</span>
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-3)" }}>{m.date}</td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-3)" }}>{m.duration}</td>
      <td style={{ padding: "12px 14px" }}><StatusBadge status={m.status}/></td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{m.possession[0]}/{m.possession[1]}</td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{m.passes}</td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{m.distance}</td>
      <td style={{ padding: "12px 14px", textAlign: "right" }}>
        {ready ? <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); go("/analysis/" + m.id); }}>Open<Icon name="arrow-right" size={14}/></button>
          : <span style={{ fontSize: 12, color: "var(--fg-4)" }}>—</span>}
      </td>
    </tr>
  );
}

function RoadmapCard({ r }) {
  return (
    <div className="card card-pad" style={{ position: "relative", background: "var(--surface-1)" }}>
      <div className="row center between">
        <div style={{ width: 38, height: 38, borderRadius: 9, background: "#fff", border: "1px solid var(--border)", color: "var(--steel-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={r.icon} size={19}/></div>
        <span className="badge badge-soon"><Icon name="sparkles" size={12}/>{r.tag}</span>
      </div>
      <h4 style={{ fontSize: 16, fontWeight: 700, margin: "16px 0 6px", color: "var(--fg-2)" }}>{r.title}</h4>
      <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--fg-4)", margin: 0 }}>{r.desc}</p>
    </div>
  );
}

Object.assign(window, { MatchCard, MatchRow, RoadmapCard, MiniPitch });
