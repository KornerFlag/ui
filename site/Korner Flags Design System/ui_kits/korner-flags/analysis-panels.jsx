/* Korner Flags UI kit — Match Analysis sub-panels:
   possession, passing, running output, heatmap review, roadmap. */

function PanelHead({ icon, title, note, right }) {
  return (
    <div className="row center between" style={{ marginBottom: 18 }}>
      <div className="row center" style={{ gap: 11 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--surface-2)", color: "var(--steel-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={18}/></div>
        <div className="col">
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600, letterSpacing: "-.01em", margin: 0, color: "var(--fg-1)" }}>{title}</h3>
          {note && <span style={{ fontSize: 12.5, color: "var(--fg-4)" }}>{note}</span>}
        </div>
      </div>
      {right}
    </div>
  );
}

// ---------- POSSESSION ----------
function PossessionSplit({ m }) {
  const [a, b] = m.possession;
  return (
    <div className="card card-pad">
      <div className="row center between" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--fg-1)" }}>Possession</h3>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-4)" }}>Estimated</span>
      </div>
      <div className="row" style={{ height: 46, borderRadius: 10, overflow: "hidden" }}>
        <div className="row center" style={{ width: a + "%", background: "var(--steel-600)", color: "#fff", paddingLeft: 16, gap: 9 }}>
          <span className="stat-num" style={{ fontSize: 20, color: "#fff" }}>{a}%</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".04em", opacity: .85 }}>NC STATE</span>
        </div>
        <div className="row center between" style={{ width: b + "%", background: "var(--slate-200)", color: "var(--slate-700)", paddingRight: 16, justifyContent: "flex-end", gap: 9 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".04em", opacity: .85 }}>OPPONENT</span>
          <span className="stat-num" style={{ fontSize: 20 }}>{b}%</span>
        </div>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--fg-3)", margin: "14px 0 0" }}>Possession is estimated from processed match segments and intended for tactical review.</p>
    </div>
  );
}

// ---------- PASSING ----------
function PassNetwork() {
  // simplified positional network (data-viz placeholder)
  const nodes = [
    { id: 3, x: 18, y: 50, r: 15 }, { id: 16, x: 30, y: 22, r: 13 }, { id: 4, x: 32, y: 78, r: 16 },
    { id: 21, x: 48, y: 38, r: 17 }, { id: 12, x: 52, y: 64, r: 22 }, { id: 7, x: 72, y: 30, r: 19 },
    { id: 9, x: 78, y: 62, r: 16 },
  ];
  const links = [[0, 3], [1, 3], [2, 4], [3, 4], [3, 5], [4, 5], [4, 6], [5, 6], [0, 2]];
  const find = i => nodes[i];
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", borderRadius: "var(--radius-md)", overflow: "hidden", background: "linear-gradient(160deg,#0E1A2B,#16273D)" }}>
      <div style={{ position: "absolute", inset: "6% 5%", opacity: .55 }}><PitchLines stroke="rgba(255,255,255,.16)"/></div>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 62" preserveAspectRatio="none">
        {links.map(([s, e], i) => {
          const A = find(s), B = find(e);
          return <line key={i} x1={A.x} y1={A.y * .62} x2={B.x} y2={B.y * .62} stroke="rgba(107,160,216,.5)" strokeWidth={(0.4 + i % 3 * 0.25)}/>;
        })}
      </svg>
      {nodes.map(n => (
        <div key={n.id} style={{ position: "absolute", left: n.x + "%", top: n.y + "%", width: n.r, height: n.r, transform: "translate(-50%,-50%)", borderRadius: "50%", background: "var(--steel-500)", border: "1.5px solid #cfe0f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, color: "#fff" }}>{n.id}</div>
      ))}
      <div style={{ position: "absolute", left: 12, bottom: 10, fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(255,255,255,.7)" }}>Simplified passing network</div>
    </div>
  );
}

function PassingStatsPanel({ m }) {
  const D = window.KF_DATA;
  return (
    <div className="card card-pad">
      <PanelHead icon="git-branch" title="Passing" note="How the team circulated the ball and linked phases."/>
      <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--fg-3)", margin: "0 0 22px", maxWidth: 760 }}>
        Passing analysis highlights how the team circulated the ball, which players linked phases together, and where possession broke down.
      </p>

      {/* top stats */}
      <div className="row wrap" style={{ gap: 28, marginBottom: 24 }}>
        {[["Team passes", m.passes, ""], ["Completion", "83", "%"], ["Final-third entries", "37", ""], ["Longest sequence", "14", " passes"]].map(([l, v, u]) => (
          <div key={l} className="col" style={{ gap: 3 }}>
            <span className="stat-num" style={{ fontSize: 26 }}>{v}<span style={{ fontSize: 14, color: "var(--fg-3)" }}>{u}</span></span>
            <span style={{ fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--fg-4)" }}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {/* network */}
        <PassNetwork/>
        {/* leaders + combinations */}
        <div className="col" style={{ gap: 22 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 12 }}>Passing leaders</div>
            <div className="col" style={{ gap: 10 }}>
              {D.passLeaders.map(p => (
                <div key={p.id} className="row center" style={{ gap: 12 }}>
                  <span style={{ width: 44, fontSize: 12.5, fontWeight: 700, color: "var(--fg-2)" }}>#{p.id}</span>
                  <div className="grow" style={{ height: 8, borderRadius: 4, background: "var(--surface-2)", overflow: "hidden" }}><div style={{ width: p.pct + "%", height: "100%", borderRadius: 4, background: "var(--steel-500)" }}/></div>
                  <span className="stat-num" style={{ fontSize: 13, width: 32, textAlign: "right" }}>{p.passes}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 12 }}>Top combinations</div>
            <div className="row wrap" style={{ gap: 8 }}>
              {D.combos.map((c, i) => (
                <div key={i} className="row center" style={{ gap: 8, background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: 999, padding: "7px 13px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 600, color: "var(--fg-2)" }}>#{c.a}</span>
                  <Icon name="arrow-right" size={13} style={{ color: "var(--slate-300)" }}/>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 600, color: "var(--fg-2)" }}>#{c.b}</span>
                  <span style={{ fontSize: 11, color: "var(--fg-4)", marginLeft: 2 }}>{c.count}×</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- RUNNING OUTPUT ----------
function RunningOutput() {
  const D = window.KF_DATA;
  const loadColor = { High: "var(--signal-600)", Med: "var(--amber-600)", Low: "var(--steel-600)" };
  return (
    <div className="card card-pad">
      <PanelHead icon="footprints" title="Player running output" note="Distance and movement load by player. Roster names are mapped as data improves — shown as player IDs for now."/>
      <div className="col" style={{ gap: 2 }}>
        {D.players.map(p => (
          <div key={p.id} className="row center" style={{ gap: 16, padding: "11px 8px", borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--ink-800)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, flex: "none" }}>{p.id}</div>
            <div style={{ width: 92, flex: "none" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)" }}>Player {p.id}</div>
              <div style={{ fontSize: 12, color: "var(--fg-4)" }}>{p.note}</div>
            </div>
            <div className="grow" style={{ height: 10, borderRadius: 5, background: "var(--surface-2)", overflow: "hidden", minWidth: 80 }}>
              <div style={{ width: p.pct + "%", height: "100%", borderRadius: 5, background: "linear-gradient(90deg,var(--steel-400),var(--steel-600))" }}/>
            </div>
            <span className="stat-num" style={{ fontSize: 16, width: 64, textAlign: "right" }}>{p.dist}</span>
            <span className="badge" style={{ width: 58, justifyContent: "center", background: "transparent", color: loadColor[p.load], border: "1px solid currentColor", fontSize: 11 }}>{p.load}</span>
          </div>
        ))}
      </div>
      {/* speed — muted secondary */}
      <div className="row center" style={{ gap: 9, marginTop: 16, padding: "10px 14px", background: "var(--surface-1)", borderRadius: 8, border: "1px solid var(--border-soft)" }}>
        <Icon name="gauge" size={16} style={{ color: "var(--slate-400)" }}/>
        <span style={{ fontSize: 12.5, color: "var(--fg-4)" }}>Sprint speed is held back while <strong style={{ color: "var(--fg-3)" }}>speed calibration is under review</strong>. We emphasise distance and movement load, which are more stable.</span>
      </div>
    </div>
  );
}

// ---------- HEATMAP REVIEW ----------
function HeatmapReview({ m }) {
  const D = window.KF_DATA;
  const [team, setTeam] = React.useState("A");
  const blobsKey = team === "A" ? m.blobs : (m.blobs === "left" ? "wide" : "central");
  const tags = team === "A"
    ? ["Left-side buildup", "Central overload", "Final third activity"]
    : ["Wide containment", "Mid-block shape", "Counter origin"];
  return (
    <div className="card card-pad">
      <PanelHead icon="flame" title="Heatmaps" note="Generated from tracked player positioning across the selected match segment."
        right={
          <div className="row center" style={{ gap: 10 }}>
            <div className="row" style={{ background: "var(--surface-2)", borderRadius: 8, padding: 3 }}>
              {["A", "B"].map(t => (
                <button key={t} onClick={() => setTeam(t)} style={{ padding: "7px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 700, background: team === t ? "#fff" : "transparent", color: team === t ? "var(--steel-600)" : "var(--slate-400)", boxShadow: team === t ? "var(--shadow-xs)" : "none" }}>Team {t}</button>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm"><Icon name="users" size={15}/>Per-player<span style={{ fontSize: 10, fontWeight: 700, color: "var(--steel-600)", background: "var(--steel-100)", padding: "1px 6px", borderRadius: 999 }}>Soon</span></button>
          </div>
        }/>
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 22 }}>
        <div>
          <div style={{ aspectRatio: "16/10", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--ink-600)" }}>
            <HeatPitch blobs={D.heatBlobs[blobsKey]} label={"Team " + team + " · positioning"}/>
          </div>
          <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>
            {tags.map(t => (
              <span key={t} className="row center" style={{ gap: 7, background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: 999, padding: "6px 13px", fontSize: 13, fontWeight: 600, color: "var(--fg-2)" }}><Icon name="map-pin" size={13} style={{ color: "var(--steel-600)" }}/>{t}</span>
            ))}
          </div>
        </div>
        <div className="col" style={{ gap: 14 }}>
          <div style={{ background: "var(--steel-050)", border: "1px solid var(--steel-100)", borderRadius: 12, padding: 18 }}>
            <div className="row center" style={{ gap: 8, marginBottom: 8 }}><Icon name="activity" size={16} style={{ color: "var(--steel-600)" }}/><span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--steel-700)" }}>Tactical takeaway</span></div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--fg-2)", margin: 0 }}>
              {team === "A"
                ? "Heavy left-side buildup with a recurring central overload. Activity concentrated in the left half-space before final-third entries."
                : "Compact mid-block holding central areas, conceding wide space. Counters originated from regains around the halfway line."}
            </p>
          </div>
          <div style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg-3)", marginBottom: 10 }}>Player heatmap</div>
            <div className="row center between" style={{ padding: "10px 12px", background: "#fff", border: "1px dashed var(--border)", borderRadius: 8, color: "var(--fg-4)" }}>
              <span className="row center" style={{ gap: 8, fontSize: 13 }}><Icon name="users" size={15}/>Select a player</span>
              <Icon name="chevron-down" size={15}/>
            </div>
            <p style={{ fontSize: 12, color: "var(--fg-4)", margin: "10px 0 0", lineHeight: 1.45 }}>Individual positioning maps are part of the roadmap.</p>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--fg-4)", margin: "16px 0 0" }}>Heatmaps are generated from tracked player positioning across the selected match segment.</p>
    </div>
  );
}

// ---------- ROADMAP ----------
function RoadmapSection() {
  const D = window.KF_DATA;
  return (
    <div>
      <PanelHead icon="sparkles" title="Premium roadmap" note="Analytics we're building next — clearly marked, never broken placeholders."/>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {D.roadmap.map(r => <RoadmapCard key={r.title} r={r}/>)}
      </div>
    </div>
  );
}

Object.assign(window, { PanelHead, PossessionSplit, PassingStatsPanel, RunningOutput, HeatmapReview, RoadmapSection });
