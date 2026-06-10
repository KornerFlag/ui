/* Korner Flags UI kit — navigation: marketing header + product shell. */

function MarketingHeader({ go }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const el = document.querySelector("#scroll-root") || window;
    const onScroll = () => setScrolled((el.scrollTop || window.scrollY) > 12);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: scrolled ? "rgba(11,22,38,.86)" : "transparent",
      backdropFilter: scrolled ? "blur(10px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,.08)" : "1px solid transparent",
      transition: "all .25s var(--ease-out)",
    }}>
      <div className="container row center between" style={{ height: 74 }}>
        <a onClick={() => go("/")} style={{ cursor: "pointer" }}><Logo dark/></a>
        <nav className="row center" style={{ gap: 4 }}>
          {["Product", "Analysis", "Pricing", "Demo"].map(l => (
            <a key={l} onClick={() => go(l === "Pricing" ? "/checkout" : l === "Analysis" || l === "Demo" ? "/analysis/ncsu-wash" : "/dashboard")}
              style={{ padding: "9px 14px", fontSize: 14, fontWeight: 600, color: "var(--fg-on-ink-soft)", borderRadius: 6, cursor: "pointer", transition: "color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--fg-on-ink-soft)"}>{l}</a>
          ))}
        </nav>
        <div className="row center" style={{ gap: 10 }}>
          <button className="btn btn-ghost-onink btn-sm" onClick={() => go("/dashboard")}>Sign in</button>
          <button className="btn btn-onink btn-sm" onClick={() => go("/analysis/ncsu-wash")}>View demo<Icon name="arrow-right" size={15}/></button>
        </div>
      </div>
    </header>
  );
}

const NAV_ITEMS = [
  { key: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "/matches", label: "Past Matches", icon: "history" },
  { key: "/analysis/ncsu-wash", label: "Match Analysis", icon: "video" },
  { key: "/checkout", label: "Pricing & Plans", icon: "credit-card" },
];

function ProductShell({ go, route, active, title, sub, actions, children, scrollRef }) {
  return (
    <div className="row" style={{ minHeight: "100vh" }}>
      {/* sidebar */}
      <aside style={{ width: 246, flex: "none", background: "var(--ink-800)", borderRight: "1px solid var(--ink-600)", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "20px 20px 18px" }}>
          <a onClick={() => go("/")} style={{ cursor: "pointer" }}><Logo dark size={30}/></a>
        </div>
        <nav style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV_ITEMS.map(it => {
            const on = active === it.key || (it.key.startsWith("/analysis") && active === "/analysis");
            return (
              <a key={it.key} onClick={() => go(it.key)} className="row center" style={{
                gap: 11, padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600,
                color: on ? "#fff" : "var(--fg-on-ink-soft)",
                background: on ? "var(--steel-700)" : "transparent",
                transition: "all .15s",
              }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--ink-700)"; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                <Icon name={it.icon} size={18} stroke={2}/>{it.label}
              </a>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", padding: 16 }}>
          <div style={{ background: "var(--ink-700)", border: "1px solid var(--ink-600)", borderRadius: 10, padding: 14 }}>
            <div className="row center" style={{ gap: 7, marginBottom: 6 }}>
              <Icon name="shield" size={15} style={{ color: "var(--steel-400)" }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Pilot Program</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-on-ink-soft)", lineHeight: 1.45 }}>4 of 6 analyses used this month.</div>
            <button className="btn btn-onink btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => go("/checkout")}>Manage plan</button>
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="grow col" style={{ minWidth: 0 }}>
        <header className="row center between" style={{ height: 68, padding: "0 32px", borderBottom: "1px solid var(--border)", background: "rgba(247,249,252,.85)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 30 }}>
          <div className="col" style={{ gap: 2 }}>
            {sub && <span style={{ fontSize: 12, color: "var(--fg-4)", fontWeight: 600 }}>{sub}</span>}
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 21, letterSpacing: "-.01em", margin: 0, color: "var(--fg-1)" }}>{title}</h1>
          </div>
          <div className="row center" style={{ gap: 12 }}>
            {actions}
            <button className="btn btn-ghost btn-sm" style={{ padding: 9, position: "relative" }}><Icon name="bell" size={18}/><span style={{ position: "absolute", top: 7, right: 8, width: 6, height: 6, borderRadius: "50%", background: "var(--steel-600)" }}/></button>
            <div className="row center" style={{ gap: 9, paddingLeft: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--steel-100)", color: "var(--steel-700)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>JM</div>
            </div>
          </div>
        </header>
        <main id="scroll-root" ref={scrollRef} style={{ flex: 1, overflowY: "auto", height: "calc(100vh - 68px)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { MarketingHeader, ProductShell, NAV_ITEMS });
