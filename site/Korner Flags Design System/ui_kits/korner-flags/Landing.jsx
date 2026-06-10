/* Korner Flags UI kit — Landing (marketing homepage). */
function Landing({ go }) {
  const [playing, setPlaying] = React.useState(false);
  const D = window.KF_DATA;
  const surfaces = [
    { icon: "video", title: "Video review", desc: "Annotated footage with review moments and clip marking." },
    { icon: "activity", title: "Possession", desc: "How the ball was circulated, estimated from match segments." },
    { icon: "git-branch", title: "Passing stats", desc: "Pass volume, leaders, and how players linked phases." },
    { icon: "footprints", title: "Running output", desc: "Distance and movement load by player across the match." },
    { icon: "flame", title: "Heatmaps", desc: "Team positioning maps for tactical review." },
    { icon: "flag", title: "Foul review", desc: "Flagged moments to revisit incidents with your staff." },
  ];
  const steps = [
    { n: "01", icon: "upload", title: "Upload or share footage", desc: "Send us your match video, or connect a shared recording. No special setup." },
    { n: "02", icon: "activity", title: "We process movement & tactics", desc: "Korner Flags turns the footage into movement, possession and passing data." },
    { n: "03", icon: "video", title: "Review a coach-ready room", desc: "Open an analysis room built for tactical conversations and meetings." },
  ];
  return (
    <div id="scroll-root" style={{ height: "100vh", overflowY: "auto", background: "var(--surface-1)" }}>
      {/* HERO */}
      <div style={{ background: "radial-gradient(120% 90% at 70% -10%, #1A2C44 0%, #0B1626 60%)", position: "relative" }}>
        <MarketingHeader go={go}/>
        <div className="container" style={{ paddingTop: 64, paddingBottom: 72 }}>
          <div className="row" style={{ gap: 56, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 440px", minWidth: 320 }}>
              <span className="badge badge-soon" style={{ background: "rgba(107,160,216,.16)", color: "var(--steel-400)", marginBottom: 22 }}><Icon name="circle-dot" size={13}/>Onboarding select pilot programs</span>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(40px,5vw,58px)", lineHeight: 1.04, letterSpacing: "-.025em", color: "#fff", margin: "0 0 20px" }}>
                Coach-ready soccer analysis from match footage.
              </h1>
              <p style={{ fontSize: 19, lineHeight: 1.55, color: "var(--fg-on-ink-soft)", margin: "0 0 30px", maxWidth: 520 }}>
                Korner Flags turns game video into movement, possession, passing, heatmap, and review-ready insights coaches can actually use.
              </p>
              <div className="row wrap" style={{ gap: 12 }}>
                <button className="btn btn-onink btn-lg" onClick={() => go("/analysis/ncsu-wash")}><Icon name="play" size={17}/>View sample analysis</button>
                <button className="btn btn-ghost-onink btn-lg" onClick={() => go("/checkout")}>See packages</button>
              </div>
            </div>
            {/* featured demo card */}
            <div style={{ flex: "1 1 440px", minWidth: 320 }}>
              <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--radius-xl)", padding: 14 }}>
                <VideoFrame playing={playing} onToggle={() => setPlaying(p => !p)}>
                  <div style={{ position: "absolute", top: 14, left: 14 }}>
                    <span className="badge" style={{ background: "rgba(11,22,38,.7)", color: "#fff", backdropFilter: "blur(4px)" }}><span className="dot" style={{ background: "var(--signal-600)" }}/>Demo data — sample analysis</span>
                  </div>
                  <div style={{ position: "absolute", left: 14, right: 14, bottom: 14 }}>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,.2)", position: "relative" }}>
                      <div style={{ width: "38%", height: "100%", borderRadius: 2, background: "var(--steel-400)" }}/>
                    </div>
                    <div className="row between" style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,.75)" }}><span>35:02</span><span>92:14</span></div>
                  </div>
                </VideoFrame>
                <div className="row wrap" style={{ gap: 8, padding: "14px 4px 4px" }}>
                  {[["Possession", "54 / 46"], ["Team distance", "67.4 km"], ["Passes", "412"], ["Heatmap", "Available"]].map(([l, v]) => (
                    <div key={l} className="row center" style={{ gap: 7, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 999, padding: "6px 12px" }}>
                      <span style={{ fontSize: 11, color: "var(--fg-on-ink-soft)", fontWeight: 600 }}>{l}</span>
                      <span className="stat-num" style={{ fontSize: 13, color: "#fff" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="container" style={{ padding: "80px 32px 12px" }}>
        <SectionHead eyebrow="How it works" title="From footage to a coach-ready room" sub="A simple workflow built around the way coaches actually review matches." center/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 48 }}>
          {steps.map(s => (
            <div key={s.n} className="card card-pad" style={{ padding: 26 }}>
              <div className="row center between">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--steel-050)", color: "var(--steel-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={s.icon} size={21}/></div>
                <span className="stat-num" style={{ fontSize: 22, color: "var(--slate-200)" }}>{s.n}</span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, margin: "20px 0 8px", color: "var(--fg-1)" }}>{s.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--fg-3)", margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ANALYTICS SURFACES */}
      <div className="container" style={{ padding: "72px 32px" }}>
        <SectionHead eyebrow="Analytics surfaces" title="Everything to support the conversation" sub="Video-first analysis with supporting metrics — never stats for their own sake."/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 40 }}>
          {surfaces.map(s => (
            <div key={s.title} className="card card-pad card-hover" style={{ cursor: "pointer" }} onClick={() => go("/analysis/ncsu-wash")}>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--surface-2)", color: "var(--steel-600)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Icon name={s.icon} size={20}/></div>
              <div className="row center between">
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--fg-1)" }}>{s.title}</h4>
                <Icon name="arrow-up-right" size={16} style={{ color: "var(--slate-300)" }}/>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--fg-3)", margin: "8px 0 0" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CREDIBILITY / PILOT */}
      <div style={{ background: "var(--ink-800)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .25 }}><PitchLines stroke="rgba(122,160,210,.18)"/></div>
        <div className="container" style={{ padding: "72px 32px", position: "relative" }}>
          <div className="row wrap" style={{ gap: 48, alignItems: "center" }}>
            <div style={{ flex: "1 1 420px" }}>
              <SectionHead eyebrow="Built with coaches" title="Currently onboarding select pilot programs" sub="We're working closely with a small number of programs to make match review genuinely useful. Some calibration-backed metrics are still being refined — and we're honest about it." light/>
              <button className="btn btn-onink btn-lg" style={{ marginTop: 28 }} onClick={() => go("/checkout")}>Join a pilot<Icon name="arrow-right" size={16}/></button>
            </div>
            <div style={{ flex: "1 1 320px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["Video-first", "Footage leads every review"], ["Honest data", "Estimates labelled clearly"], ["Coach-facing", "Built for meetings, not dashboards"], ["Player IDs", "Names mapped as data improves"]].map(([t, d]) => (
                <div key={t} style={{ background: "var(--ink-700)", border: "1px solid var(--ink-600)", borderRadius: 12, padding: 18 }}>
                  <Icon name="check-circle" size={20} style={{ color: "var(--steel-400)", marginBottom: 10 }}/>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{t}</div>
                  <div style={{ fontSize: 13, color: "var(--fg-on-ink-soft)", marginTop: 3, lineHeight: 1.4 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA BAND */}
      <div className="container" style={{ padding: "76px 32px" }}>
        <div className="card" style={{ padding: "52px 48px", textAlign: "center", background: "linear-gradient(180deg,#fff,var(--steel-050))" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 34, letterSpacing: "-.02em", margin: "0 0 12px", color: "var(--fg-1)" }}>Want to see what your match looks like inside Korner Flags?</h2>
          <p style={{ fontSize: 17, color: "var(--fg-3)", margin: "0 auto 28px", maxWidth: 520 }}>Start with a sample analysis and walk your staff through a real review room.</p>
          <div className="row center" style={{ gap: 12, justifyContent: "center" }}>
            <button className="btn btn-primary btn-lg" onClick={() => go("/analysis/ncsu-wash")}>Start with a sample analysis<Icon name="arrow-right" size={16}/></button>
            <button className="btn btn-secondary btn-lg" onClick={() => go("/dashboard")}>Open dashboard</button>
          </div>
        </div>
      </div>

      <Footer go={go}/>
    </div>
  );
}

function Footer({ go }) {
  return (
    <footer style={{ background: "var(--ink-900)", padding: "44px 0" }}>
      <div className="container row wrap between center" style={{ gap: 20 }}>
        <Logo dark size={28}/>
        <div className="row wrap" style={{ gap: 22 }}>
          {["Product", "Pricing", "Demo", "Privacy", "Contact"].map(l => (
            <a key={l} onClick={() => go(l === "Pricing" ? "/checkout" : "/dashboard")} style={{ fontSize: 13, color: "var(--fg-on-ink-soft)", cursor: "pointer" }}>{l}</a>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--slate-500)" }}>© 2026 Korner Flags · Demo data</span>
      </div>
    </footer>
  );
}

Object.assign(window, { Landing, Footer });
