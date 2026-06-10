/* Korner Flags UI kit — Past Matches (archive / history). */
function PastMatches({ go }) {
  const D = window.KF_DATA;
  const [view, setView] = React.useState("grid");
  const [filter, setFilter] = React.useState("All");
  const [q, setQ] = React.useState("");
  const filters = ["All", "Ready", "Processing", "Draft"];
  const list = D.matches.filter(m =>
    (filter === "All" || m.status === filter) &&
    (q === "" || (m.title + " " + m.label).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <ProductShell go={go} active="/matches" sub="Analysis history" title="Past Matches">
      <div style={{ padding: "28px 32px 64px", maxWidth: 1180, margin: "0 auto" }}>

        {/* filter / search bar */}
        <div className="card card-pad row center between wrap" style={{ gap: 14, padding: 16 }}>
          <div className="row center wrap" style={{ gap: 8 }}>
            {filters.map(f => (
              <button key={f} className={"chip" + (filter === f ? " chip-on" : "")} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="row center" style={{ gap: 10 }}>
            <div style={{ position: "relative", width: 240 }}>
              <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)" }}/>
              <input className="input" style={{ paddingLeft: 36 }} placeholder="Search matches…" value={q} onChange={e => setQ(e.target.value)}/>
            </div>
            <div className="row" style={{ background: "var(--surface-2)", borderRadius: 8, padding: 3 }}>
              {[["grid", "dashboard"], ["table", "menu"]].map(([v, ic]) => (
                <button key={v} onClick={() => setView(v)} style={{ padding: "7px 9px", borderRadius: 6, border: "none", background: view === v ? "#fff" : "transparent", color: view === v ? "var(--steel-600)" : "var(--slate-400)", boxShadow: view === v ? "var(--shadow-xs)" : "none" }}><Icon name={ic} size={17}/></button>
              ))}
            </div>
          </div>
        </div>

        <div className="row center between" style={{ margin: "22px 2px 16px" }}>
          <span style={{ fontSize: 13, color: "var(--fg-4)", fontWeight: 600 }}>{list.length} {list.length === 1 ? "match" : "matches"}</span>
          <span style={{ fontSize: 13, color: "var(--fg-4)" }}>Season 25/26</span>
        </div>

        {/* grid view */}
        {view === "grid" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {list.map(m => <MatchCard key={m.id} m={m} go={go}/>)}
          </div>
        )}

        {/* table view */}
        {view === "table" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
                  {["Match", "Date", "Duration", "Status", "Poss", "Passes", "Distance", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: i === 7 ? "right" : "left", padding: "11px 14px", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--fg-4)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(m => <MatchRow key={m.id} m={m} go={go}/>)}
              </tbody>
            </table>
          </div>
        )}

        {list.length === 0 && (
          <div className="card card-pad" style={{ textAlign: "center", padding: 64 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--surface-2)", color: "var(--slate-400)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Icon name="search" size={24}/></div>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px", color: "var(--fg-1)" }}>No matches found</h4>
            <p style={{ fontSize: 14, color: "var(--fg-3)", margin: 0 }}>Try a different filter or search term.</p>
          </div>
        )}
      </div>
    </ProductShell>
  );
}
Object.assign(window, { PastMatches });
