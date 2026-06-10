/* Korner Flags UI kit — Match Analysis (flagship). Video is the hero. */
function MatchAnalysis({ go, id }) {
  const D = window.KF_DATA;
  const m = D.matches.find(x => x.id === id) || D.matches[0];
  const [playing, setPlaying] = React.useState(false);
  const [overlays, setOverlays] = React.useState({ tracking: true, passing: false, heat: false });
  const toggle = k => setOverlays(o => ({ ...o, [k]: !o[k] }));
  const ovBtns = [["tracking", "Show tracking", "crosshair"], ["passing", "Show passing", "git-branch"], ["heat", "Show heat zones", "flame"], ["clip", "Mark clip", "bookmark"]];

  const actions = (
    <div className="row center" style={{ gap: 10 }}>
      <button className="btn btn-ghost btn-sm"><Icon name="bookmark" size={15}/>Share</button>
      <button className="btn btn-secondary btn-sm" onClick={() => go("/matches")}><Icon name="arrow-left" size={15}/>All matches</button>
    </div>
  );

  return (
    <ProductShell go={go} active="/analysis" sub={m.label + " · " + m.date} title={m.title} actions={actions}>
      <div style={{ padding: "26px 32px 64px", maxWidth: 1180, margin: "0 auto" }}>

        {/* HERO VIDEO */}
        <div className="row wrap" style={{ gap: 20 }}>
          <div style={{ flex: "1 1 640px", minWidth: 360 }}>
            <VideoFrame playing={playing} onToggle={() => setPlaying(p => !p)}>
              <div style={{ position: "absolute", top: 14, left: 14 }}>
                <span className="badge" style={{ background: "rgba(11,22,38,.7)", color: "#fff", backdropFilter: "blur(4px)" }}><span className="dot" style={{ background: "var(--signal-600)" }}/>Demo data — sample analysis</span>
              </div>
              {/* timeline + markers */}
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
                <div style={{ position: "relative", height: 5, borderRadius: 3, background: "rgba(255,255,255,.2)" }}>
                  <div style={{ width: "38%", height: "100%", borderRadius: 3, background: "var(--steel-400)" }}/>
                  {D.moments.map((mo, i) => (
                    <div key={i} title={mo.label} style={{ position: "absolute", left: mo.pct + "%", top: "50%", transform: "translate(-50%,-50%)", width: 9, height: 9, borderRadius: "50%", background: "#fff", border: "2px solid var(--steel-600)", cursor: "pointer" }}/>
                  ))}
                </div>
                <div className="row between" style={{ marginTop: 9, fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,.78)" }}><span>35:02</span><span>{m.duration}</span></div>
              </div>
            </VideoFrame>
            {/* overlay controls */}
            <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
              {ovBtns.map(([k, label, ic]) => {
                const on = overlays[k];
                return (
                  <button key={k} onClick={() => k !== "clip" && toggle(k)} className="row center" style={{ gap: 7, padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid " + (on ? "var(--steel-600)" : "var(--border)"), background: on ? "var(--steel-600)" : "#fff", color: on ? "#fff" : "var(--fg-2)", transition: "all .15s" }}>
                    <Icon name={ic} size={15}/>{label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* coach insight sidebar */}
          <div style={{ flex: "1 1 300px", minWidth: 280 }}>
            <div className="card card-pad" style={{ height: "100%" }}>
              <span className="eyebrow">Review moments</span>
              <div className="col" style={{ gap: 2, marginTop: 14 }}>
                {D.moments.map((mo, i) => (
                  <div key={i} className="row center" style={{ gap: 12, padding: "10px 8px", borderBottom: i < D.moments.length - 1 ? "1px solid var(--border-soft)" : "none", cursor: "pointer", borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface-1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span className="stat-num" style={{ fontSize: 13, color: "var(--steel-600)", width: 44 }}>{mo.t}</span>
                    <span style={{ fontSize: 13.5, color: "var(--fg-2)", flex: 1 }}>{mo.label}</span>
                    <Icon name="play" size={13} style={{ color: "var(--slate-300)" }}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 24 }}>
          <StatCard label="Possession" value={m.possession[0]} unit="%" sub={"vs " + m.possession[1] + "% opponent"} icon="activity"/>
          <StatCard label="Total distance" value={m.distance.replace(" km", "")} unit=" km" sub="team total" icon="footprints"/>
          <StatCard label="Passing volume" value={m.passes} sub="passes in match" icon="git-branch"/>
          <StatCard label="Review moments" value={m.moments} sub="marked for review" icon="bookmark"/>
        </div>

        {/* POSSESSION */}
        <div style={{ marginTop: 24 }}><PossessionSplit m={m}/></div>

        {/* PASSING */}
        <div style={{ marginTop: 24 }}><PassingStatsPanel m={m}/></div>

        {/* RUNNING + HEATMAP */}
        <div style={{ marginTop: 24 }}><RunningOutput/></div>
        <div style={{ marginTop: 24 }}><HeatmapReview m={m}/></div>

        {/* ROADMAP */}
        <div style={{ marginTop: 40 }}><RoadmapSection/></div>
      </div>
    </ProductShell>
  );
}
Object.assign(window, { MatchAnalysis });
