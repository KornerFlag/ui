/* Korner Flags UI kit — Checkout (package selection + order summary). */
function Checkout({ go }) {
  const D = window.KF_DATA;
  const [sel, setSel] = React.useState("pilot");
  const pkg = D.packages.find(p => p.id === sel);

  return (
    <ProductShell go={go} active="/checkout" sub="Plans & checkout" title="Choose your review package">
      <div style={{ padding: "28px 32px 64px", maxWidth: 1180, margin: "0 auto" }}>
        <p style={{ fontSize: 16, color: "var(--fg-3)", margin: "0 0 28px", maxWidth: 620 }}>
          Choose the review package that matches your program's needs. After checkout, your selected match will appear in the dashboard once analysis is ready.
        </p>

        <div className="row wrap" style={{ gap: 24, alignItems: "flex-start" }}>
          {/* tiers */}
          <div style={{ flex: "1 1 620px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {D.packages.map(p => {
              const on = sel === p.id;
              return (
                <div key={p.id} onClick={() => setSel(p.id)} className="card" style={{ padding: 22, cursor: "pointer", position: "relative", border: "1.5px solid " + (on ? "var(--steel-600)" : "var(--border)"), boxShadow: on ? "0 0 0 3px var(--steel-100), var(--shadow-md)" : "var(--shadow-sm)", transition: "all .18s" }}>
                  {p.featured && <span className="badge badge-soon" style={{ position: "absolute", top: -10, left: 22 }}><Icon name="sparkles" size={12}/>Most popular</span>}
                  <div className="row center between">
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--fg-1)" }}>{p.name}</h3>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid " + (on ? "var(--steel-600)" : "var(--slate-300)"), background: on ? "var(--steel-600)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <Icon name="check" size={12} style={{ color: "#fff" }} stroke={3}/>}</div>
                  </div>
                  <div className="row" style={{ alignItems: "baseline", gap: 6, margin: "14px 0 4px" }}>
                    {p.price != null
                      ? <><span className="stat-num" style={{ fontSize: 30 }}>${p.price}</span><span style={{ fontSize: 13, color: "var(--fg-4)" }}>{p.unit}</span></>
                      : <span className="stat-num" style={{ fontSize: 26 }}>{p.unit}</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--fg-4)", marginBottom: 16 }}>{p.best}</div>
                  <div className="col" style={{ gap: 9 }}>
                    {p.features.map(f => (
                      <div key={f} className="row" style={{ gap: 9, alignItems: "flex-start" }}>
                        <Icon name="check-circle" size={16} style={{ color: "var(--pitch-600)", marginTop: 1, flex: "none" }}/>
                        <span style={{ fontSize: 13, lineHeight: 1.4, color: "var(--fg-2)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* order summary */}
          <div style={{ flex: "1 1 320px", minWidth: 300, position: "sticky", top: 88 }}>
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border-soft)" }}>
                <span className="eyebrow">Order summary</span>
              </div>
              <div style={{ padding: "20px 22px" }}>
                <div className="row center between" style={{ marginBottom: 14 }}>
                  <div className="col" style={{ gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)" }}>{pkg.name}</span>
                    <span style={{ fontSize: 12.5, color: "var(--fg-4)" }}>{pkg.best}</span>
                  </div>
                  <span className="stat-num" style={{ fontSize: 17 }}>{pkg.price != null ? "$" + pkg.price : "Custom"}</span>
                </div>
                {/* selected match */}
                <div className="row center" style={{ gap: 12, padding: "12px", background: "var(--surface-1)", borderRadius: 10, border: "1px solid var(--border-soft)" }}>
                  <div style={{ width: 52, height: 34, borderRadius: 5, position: "relative", overflow: "hidden", background: "linear-gradient(150deg,#0E1A2B,#1F344F)", flex: "none" }}><MiniPitch blobs="left"/></div>
                  <div className="col" style={{ gap: 1 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fg-1)" }}>NC State vs Washington</span>
                    <span style={{ fontSize: 11.5, color: "var(--fg-4)" }}>Selected match · queued</span>
                  </div>
                </div>

                {/* form placeholder */}
                <div className="col" style={{ gap: 12, marginTop: 18 }}>
                  <div className="col" style={{ gap: 6 }}><label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)" }}>Email</label><input className="input" placeholder="coach@program.edu"/></div>
                  <div className="col" style={{ gap: 6 }}><label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)" }}>Card details</label>
                    <div className="row center" style={{ gap: 8 }}>
                      <div className="input row center" style={{ gap: 8, color: "var(--slate-400)" }}><Icon name="credit-card" size={16}/><span style={{ fontSize: 13 }}>•••• •••• •••• 4242</span></div>
                    </div>
                  </div>
                </div>

                <div className="row center between" style={{ margin: "18px 0 14px", paddingTop: 14, borderTop: "1px solid var(--border-soft)" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)" }}>Due today</span>
                  <span className="stat-num" style={{ fontSize: 20 }}>{pkg.price != null ? "$" + pkg.price + ".00" : "Contact us"}</span>
                </div>
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => go("/dashboard")}><Icon name="lock" size={15}/>{pkg.price != null ? "Complete checkout" : "Talk to our team"}</button>
                <div className="row center" style={{ gap: 7, marginTop: 12, justifyContent: "center", color: "var(--fg-4)" }}>
                  <Icon name="shield" size={14}/><span style={{ fontSize: 11.5 }}>Secure checkout · cancel anytime during pilot</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProductShell>
  );
}
Object.assign(window, { Checkout });
