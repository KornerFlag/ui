/* @ds-bundle: {"format":3,"namespace":"KornerFlagsDesignSystem_6612d5","components":[],"sourceHashes":{"field.js":"706c5b4bf1ff"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.KornerFlagsDesignSystem_6612d5 = window.KornerFlagsDesignSystem_6612d5 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// field.js
try { (() => {
/* ============================================================
   Korner Flag — animated tactical board (hero centerpiece)
   Pure SVG + requestAnimationFrame. No libraries.
   Renders an elegant match-room surface: pass sequences draw and
   fade, players breathe, ball trails, heat reveal, mode toggle.
   ============================================================ */
(function () {
  "use strict";

  const W = 1200,
    H = 645; // svg coordinate space
  const MX = 46,
    MY = 36; // pitch margins
  const PX = MX,
    PY = MY,
    PW = W - MX * 2,
    PH = H - MY * 2;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- home formation (attacking left -> right), normalized 0..1 of pitch ----
  const homeN = [[0.05, 0.50],
  // 0 GK
  [0.18, 0.16],
  // 1 LB
  [0.15, 0.40],
  // 2 CB
  [0.15, 0.62],
  // 3 CB
  [0.18, 0.86],
  // 4 RB
  [0.40, 0.24],
  // 5 LM
  [0.36, 0.52],
  // 6 CM
  [0.44, 0.78],
  // 7 CM
  [0.66, 0.18],
  // 8 LW
  [0.74, 0.50],
  // 9 ST
  [0.66, 0.82] // 10 RW
  ];
  const awayN = [[0.56, 0.40], [0.60, 0.62], [0.50, 0.50], [0.72, 0.30], [0.72, 0.70], [0.86, 0.50]];
  // passing build-up sequence (indices into home)
  const seq = [0, 2, 6, 5, 1, 6, 7, 9, 10, 9, 8, 6, 5, 9];
  const labels = {
    "0-1": "Build from the back",
    "3-4": "Switch of play",
    "6-7": "Overload right",
    "8-9": "Third-man run",
    "10-11": "Final third entry"
  };
  const toX = nx => PX + nx * PW;
  const toY = ny => PY + ny * PH;
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const board = document.getElementById("kf-board");
  if (!board) return;

  // ---------- build SVG ----------
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  board.querySelector(".board-stage").prepend(svg);
  const defs = document.createElementNS(NS, "defs");
  defs.innerHTML = `
    <linearGradient id="pitchG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#10271E"/>
      <stop offset="0.55" stop-color="#0E2230"/>
      <stop offset="1" stop-color="#0B1722"/>
    </linearGradient>
    <radialGradient id="ballG" cx="35%" cy="30%" r="75%">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfd8e2"/>
    </radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="7"/>
    </filter>`;
  svg.appendChild(defs);
  const mk = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  // pitch base
  svg.appendChild(mk("rect", {
    x: 0,
    y: 0,
    width: W,
    height: H,
    fill: "url(#pitchG)"
  }));
  // mowing stripes
  const stripes = mk("g", {
    opacity: ".5"
  });
  const sw = PW / 7;
  for (let i = 0; i < 7; i++) if (i % 2) stripes.appendChild(mk("rect", {
    x: PX + i * sw,
    y: PY,
    width: sw,
    height: PH,
    fill: "rgba(255,255,255,.018)"
  }));
  svg.appendChild(stripes);

  // heat layer (under lines)
  const heat = mk("g", {
    opacity: "0"
  });
  heat.style.transition = "opacity .7s cubic-bezier(.22,.61,.36,1)";
  const heatBlobs = [[.2, .42, 150, "#B24A36"], [.3, .6, 180, "#D98A3D"], [.16, .78, 130, "#E8C76B"], [.46, .5, 150, "#3D7FC4"], [.64, .4, 130, "#5B9BD8"], [.5, .66, 120, "#8FB8DD"]];
  heatBlobs.forEach(([x, y, r, c]) => heat.appendChild(mk("circle", {
    cx: toX(x),
    cy: toY(y),
    r,
    fill: c,
    filter: "url(#soft)",
    opacity: ".55"
  })));
  svg.appendChild(heat);

  // pitch lines
  const line = a => mk("rect", Object.assign({
    fill: "none",
    stroke: "rgba(255,255,255,.16)",
    "stroke-width": 1.5
  }, a));
  const lg = mk("g", {});
  lg.appendChild(line({
    x: PX,
    y: PY,
    width: PW,
    height: PH,
    rx: 4
  }));
  lg.appendChild(mk("line", {
    x1: PX + PW / 2,
    y1: PY,
    x2: PX + PW / 2,
    y2: PY + PH,
    stroke: "rgba(255,255,255,.16)",
    "stroke-width": 1.5
  }));
  lg.appendChild(mk("circle", {
    cx: PX + PW / 2,
    cy: PY + PH / 2,
    r: 64,
    fill: "none",
    stroke: "rgba(255,255,255,.16)",
    "stroke-width": 1.5
  }));
  lg.appendChild(mk("circle", {
    cx: PX + PW / 2,
    cy: PY + PH / 2,
    r: 3,
    fill: "rgba(255,255,255,.28)"
  }));
  // boxes
  const boxH = PH * 0.55,
    box6 = PH * 0.24;
  lg.appendChild(line({
    x: PX,
    y: PY + (PH - boxH) / 2,
    width: 110,
    height: boxH
  }));
  lg.appendChild(line({
    x: PX,
    y: PY + (PH - box6) / 2,
    width: 44,
    height: box6
  }));
  lg.appendChild(line({
    x: PX + PW - 110,
    y: PY + (PH - boxH) / 2,
    width: 110,
    height: boxH
  }));
  lg.appendChild(line({
    x: PX + PW - 44,
    y: PY + (PH - box6) / 2,
    width: 44,
    height: box6
  }));
  svg.appendChild(lg);

  // groups for dynamic content
  const gTrail = mk("g", {});
  svg.appendChild(gTrail);
  const gPass = mk("g", {});
  svg.appendChild(gPass);
  const gAway = mk("g", {});
  svg.appendChild(gAway);
  const gHome = mk("g", {});
  svg.appendChild(gHome);
  const gBall = mk("g", {});
  svg.appendChild(gBall);

  // away dots (outline)
  awayN.forEach(([x, y]) => {
    gAway.appendChild(mk("circle", {
      cx: toX(x),
      cy: toY(y),
      r: 9,
      fill: "rgba(14,24,34,.5)",
      stroke: "rgba(255,255,255,.4)",
      "stroke-width": 1.5
    }));
  });

  // home dots
  const homeEls = homeN.map(([x, y]) => {
    const g = mk("g", {});
    const halo = mk("circle", {
      cx: toX(x),
      cy: toY(y),
      r: 11,
      fill: "#2C6AD4",
      opacity: "0"
    });
    const dot = mk("circle", {
      cx: toX(x),
      cy: toY(y),
      r: 9.5,
      fill: "#3F86E0",
      stroke: "#cfe0f7",
      "stroke-width": 1.5
    });
    g.appendChild(halo);
    g.appendChild(dot);
    gHome.appendChild(g);
    return {
      g,
      dot,
      halo,
      bx: toX(x),
      by: toY(y)
    };
  });

  // ball
  const ball = mk("circle", {
    r: 7,
    fill: "url(#ballG)",
    stroke: "rgba(14,24,34,.25)",
    "stroke-width": 1
  });
  gBall.appendChild(ball);

  // ---------- animation state ----------
  let mode = "passing"; // passing | tracking | heat
  let segIdx = 0,
    segT = 0;
  let trail = [];
  const passLines = [];
  const t0 = performance.now();
  const matchStart = 35 * 60 + 2; // 35:02

  function setMode(m) {
    mode = m;
    document.querySelectorAll(".board-mode").forEach(b => b.classList.toggle("on", b.dataset.mode === m));
    heat.style.opacity = m === "heat" ? ".85" : "0";
    gHome.style.transition = gAway.style.transition = "opacity .6s";
    const dim = m === "heat" ? ".35" : "1";
    gHome.style.opacity = dim;
    gAway.style.opacity = m === "heat" ? ".2" : "1";
    gPass.style.opacity = m === "tracking" ? ".25" : "1";
    gTrail.style.opacity = m === "tracking" ? "1" : ".6";
  }

  // mode buttons
  document.querySelectorAll(".board-mode").forEach(b => b.addEventListener("click", () => {
    setMode(b.dataset.mode);
    userMode = performance.now();
  }));
  let userMode = 0;

  // label element helpers
  const labelEl = document.getElementById("kf-label");
  function showLabel(txt, nx, ny) {
    if (!labelEl) return;
    labelEl.textContent = txt;
    labelEl.style.left = nx * 100 + "%";
    labelEl.style.top = ny * 100 + "%";
    labelEl.classList.add("on");
    clearTimeout(showLabel._t);
    showLabel._t = setTimeout(() => labelEl.classList.remove("on"), 1700);
  }

  // passes counter + timeline els
  const elPasses = document.getElementById("kf-passes");
  const elPossA = document.getElementById("kf-poss-a");
  const elPossB = document.getElementById("kf-poss-b");
  const elTimeFill = document.getElementById("kf-time-fill");
  const elTimeNow = document.getElementById("kf-time-now");
  let passCount = 408;
  function startSeg() {
    const fromI = seq[segIdx % seq.length];
    const toI = seq[(segIdx + 1) % seq.length];
    const A = homeEls[fromI],
      B = homeEls[toI];
    // draw pass line
    const ln = mk("line", {
      x1: A.cx0 ?? A.bx,
      y1: A.by,
      x2: A.bx,
      y2: A.by,
      stroke: "rgba(120,180,250,.85)",
      "stroke-width": 2,
      "stroke-linecap": "round"
    });
    const len = Math.hypot(B.bx - A.bx, B.by - A.by);
    ln.setAttribute("x1", A.bx);
    ln.setAttribute("y1", A.by);
    ln.setAttribute("stroke-dasharray", len);
    ln.setAttribute("stroke-dashoffset", len);
    gPass.appendChild(ln);
    passLines.push({
      el: ln,
      born: performance.now(),
      len,
      x2: B.bx,
      y2: B.by,
      A
    });
    // label
    const key = `${segIdx % seq.length}-${(segIdx + 1) % seq.length}`;
    if (labels[key]) showLabel(labels[key], (A.bx + B.bx) / 2 / W, ((A.by + B.by) / 2 - 26) / H);
    return {
      A,
      B
    };
  }
  let cur = startSeg();
  function frame(now) {
    const dt = 16;
    const t = (now - t0) / 1000;

    // breathing on players
    homeEls.forEach((p, i) => {
      const ox = Math.sin(t * 1.1 + i) * 2.4;
      const oy = Math.cos(t * 0.9 + i * 1.7) * 2.4;
      p.dot.setAttribute("cx", p.bx + ox);
      p.dot.setAttribute("cy", p.by + oy);
      p.halo.setAttribute("cx", p.bx + ox);
      p.halo.setAttribute("cy", p.by + oy);
    });
    if (!reduce) {
      // advance ball along current segment
      const dur = 1.15;
      segT += dt / 1000 / dur;
      if (segT >= 1) {
        // arrival: pulse receiver, bump stats, next segment
        const B = cur.B;
        B.halo.setAttribute("opacity", ".5");
        B.halo.style.transition = "none";
        requestAnimationFrame(() => {
          B.halo.style.transition = "opacity .7s";
          B.halo.setAttribute("opacity", "0");
        });
        passCount++;
        if (elPasses) elPasses.textContent = passCount;
        segIdx++;
        segT = 0;
        cur = startSeg();
      }
      const e = easeIO(Math.min(segT, 1));
      const bx = lerp(cur.A.bx, cur.B.bx, e);
      const by = lerp(cur.A.by, cur.B.by, e);
      ball.setAttribute("cx", bx);
      ball.setAttribute("cy", by);

      // animate current pass line draw
      const lp = passLines[passLines.length - 1];
      if (lp) {
        lp.el.setAttribute("x2", bx);
        lp.el.setAttribute("y2", by);
        lp.el.setAttribute("stroke-dashoffset", lp.len * (1 - e));
      }

      // ball trail
      trail.push([bx, by]);
      if (trail.length > 16) trail.shift();

      // fade old pass lines (keep faint network)
      for (let i = passLines.length - 2; i >= 0; i--) {
        const pl = passLines[i];
        const age = (now - pl.born) / 1000;
        const op = Math.max(0.12, 0.85 - age * 0.32);
        pl.el.setAttribute("stroke", `rgba(120,180,250,${op})`);
        if (passLines.length > 7 && i === 0) {
          gPass.removeChild(pl.el);
          passLines.shift();
        }
      }
    } else {
      ball.setAttribute("cx", cur.B.bx);
      ball.setAttribute("cy", cur.B.by);
    }

    // render trail
    while (gTrail.firstChild) gTrail.removeChild(gTrail.firstChild);
    trail.forEach((p, i) => {
      const a = i / trail.length;
      gTrail.appendChild(mk("circle", {
        cx: p[0],
        cy: p[1],
        r: 2 + a * 3.5,
        fill: `rgba(120,180,250,${a * 0.5})`
      }));
    });

    // timeline + clock
    const loopT = (now - t0) / 1000 % 24 / 24;
    if (elTimeFill) elTimeFill.style.width = 8 + loopT * 84 + "%";
    if (elTimeNow) {
      const s = matchStart + Math.floor(loopT * 220);
      elTimeNow.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }

    // gentle possession sway
    if (elPossA) {
      const p = 54 + Math.round(Math.sin(t * 0.2) * 2);
      elPossA.style.width = p + "%";
      elPossB.style.width = 100 - p + "%";
    }

    // auto-cycle modes (unless user touched recently)
    if (!reduce && now - userMode > 9000) {
      const phase = Math.floor((now - t0) / 7000) % 3;
      const want = ["passing", "tracking", "heat"][phase];
      if (want !== mode) setMode(want);
    }
    requestAnimationFrame(frame);
  }
  setMode("passing");
  if (reduce) {
    // draw a few static passes for a rich still frame
    [[0, 2], [2, 6], [6, 9], [9, 10]].forEach(([a, b]) => {
      gPass.appendChild(mk("line", {
        x1: homeEls[a].bx,
        y1: homeEls[a].by,
        x2: homeEls[b].bx,
        y2: homeEls[b].by,
        stroke: "rgba(120,180,250,.55)",
        "stroke-width": 2,
        "stroke-linecap": "round"
      }));
    });
  }
  requestAnimationFrame(frame);

  // ---------- subtle parallax on hero ----------
  const wrap = document.querySelector(".board-wrap");
  const hero = document.querySelector(".hero");
  if (wrap && hero && !reduce) {
    hero.addEventListener("mousemove", e => {
      const r = hero.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / r.width;
      const dy = (e.clientY - r.top - r.height / 2) / r.height;
      wrap.style.transform = `perspective(1400px) rotateX(${(-dy * 1.6).toFixed(2)}deg) rotateY(${(dx * 2).toFixed(2)}deg) translateY(0)`;
    });
    hero.addEventListener("mouseleave", () => {
      wrap.style.transform = "";
    });
    wrap.style.transition = "transform .4s var(--ease)";
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "field.js", error: String((e && e.message) || e) }); }

})();
