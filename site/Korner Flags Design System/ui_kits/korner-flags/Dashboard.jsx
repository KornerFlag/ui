/* Korner Flags UI kit — Dashboard (logged-in product hub). */
function Dashboard({ go }) {
  const D = window.KF_DATA;
  const latest = D.matches[0];
  const recent = D.matches.slice(0, 3);

  const actions = <button className="btn btn-primary btn-sm" onClick={() => go("/checkout")}><Icon name="plus" size={16}/>New analysis</button>;

  return (
    <ProductShell go={go} active="/dashboard" sub="Tuesday, March 17" title="Welcome back, Coach Martin" actions={actions}>
      <div style={{ padding: "28px 32px 64px", maxWidth: 1180, margin: "0 auto" }}>

        {/* top widgets */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Matches reviewed" value="14" sub="this season" icon="video"/>
          <StatCard label="Processing queue" value="1" sub="NC State vs Duke" icon="clock"/>
          <StatCard label="Review moments" value="34" sub="marked across matches" icon="bookmark"/>
          <div className="card card-pad" style={{ background: "var(--ink-800)", border: "1px solid var(--ink-600)" }}>
            <div className="row center" style={{ gap: 7, color: "var(--steel-400)" }}>
              <Icon name="shield" size={15} stroke={2.2}/>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--fg-on-ink-soft)" }}>Pilot package</span>
            </div>
            <div className="stat-num" style={{ fontSize: 32, marginTop: 12, color: "#fff" }}>4<span style={{ fontSize: 16, color: "var(--fg-on-ink-soft)" }}> / 6</span></div>
            <div style={{ fontSize: 12, color: "var(--fg-on-ink-soft)", marginTop: 4 }}>analyses used this month</div>
          </div>
        </div>

        {/* latest analysis + next action */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginTop: 20 }}>
          {/* latest */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="row center between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-soft)" }}>
              <span className="eyebrow">Latest analysis</span>
              <StatusBadge status="Ready"/>
            </div>
            <div className="row" style={{ gap: 0 }}>
              <div style={{ position: "relative", width: 280, flex: "none", background: "linear-gradient(150deg,#0E1A2B,#1F344F)" }}>
                <MiniPitch blobs={latest.blobs}/>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="play" size={19} style={{ marginLeft: 2 }}/></div>
                </div>
              </div>
              <div style={{ padding: "20px 22px", flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, letterSpacing: "-.01em", color: "var(--fg-1)" }}>{latest.title}</div>
                <div className="row center" style={{ gap: 8, marginTop: 5, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-4)" }}><Icon name="calendar" size={13}/>{latest.date}<span style={{ opacity: .5 }}>·</span>{latest.duration}<span style={{ opacity: .5 }}>·</span>{latest.label}</div>
                <div className="row" style={{ gap: 26, marginTop: 18 }}>
                  {[["Possession", latest.possession[0] + "/" + latest.possession[1]], ["Passes", latest.passes], ["Distance", latest.distance], ["Moments", latest.moments]].map(([l, v]) => (
                    <div key={l} className="col" style={{ gap: 2 }}>
                      <span className="stat-num" style={{ fontSize: 19 }}>{v}</span>
                      <span style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--fg-4)" }}>{l}</span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ marginTop: 22 }} onClick={() => go("/analysis/" + latest.id)}>Open analysis<Icon name="arrow-right" size={16}/></button>
              </div>
            </div>
          </div>

          {/* next recommended action / upload */}
          <div className="col" style={{ gap: 20 }}>
            <div className="card card-pad" style={{ background: "linear-gradient(180deg,var(--steel-050),#fff)", border: "1px dashed var(--steel-200)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fff", border: "1px solid var(--steel-200)", color: "var(--steel-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="upload" size={21}/></div>
              <h4 style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 6px", color: "var(--fg-1)" }}>Start a new match</h4>
              <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--fg-3)", margin: "0 0 16px" }}>Upload or share footage and we'll build the analysis room once it's ready.</p>
              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => go("/checkout")}>Upload footage</button>
            </div>
            <div className="card card-pad">
              <span className="eyebrow">Next recommended action</span>
              <div className="row center" style={{ gap: 12, marginTop: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--amber-100)", color: "var(--amber-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="clock" size={19}/></div>
                <div className="col" style={{ gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)" }}>Review Duke match shape</span>
                  <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>Finishing processing — ready soon.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* recent analyses */}
        <div className="row center between" style={{ margin: "36px 0 18px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, letterSpacing: "-.01em", margin: 0, color: "var(--fg-1)" }}>Recent analyses</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => go("/matches")}>View all past matches<Icon name="arrow-right" size={15}/></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {recent.map(m => <MatchCard key={m.id} m={m} go={go}/>)}
        </div>
      </div>
    </ProductShell>
  );
}
Object.assign(window, { Dashboard });
