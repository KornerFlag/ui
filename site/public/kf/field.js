/* ============================================================
   Korner Flag — scroll-driven tactical board
   The move advances ONLY as you scroll:
     1. NC State steal the ball off Washington
     2. build-up passes draw and fade, the team advances
     3. the striker shoots → GOAL (ball in the net)
     4. the team heatmap reveals, with a Team 1 / Team 2 / Both toggle
   Pure SVG + requestAnimationFrame. window.KFBoard.setProgress(0..1).
   ============================================================ */
(function () {
  "use strict";
  const W = 1200, H = 645, MX = 46, MY = 36;
  const PX = MX, PY = MY, PW = W - MX * 2, PH = H - MY * 2;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const homeN = [
    [0.05, 0.50], [0.18, 0.16], [0.15, 0.40], [0.15, 0.62], [0.18, 0.86],
    [0.40, 0.24], [0.36, 0.52], [0.44, 0.78], [0.66, 0.18], [0.74, 0.50], [0.66, 0.82],
  ];
  const STEALN = [0.50, 0.42];                    // where NC State win the ball
  const awayN = [[0.56, 0.40], [0.60, 0.62], [0.50, 0.58], [0.72, 0.30], [0.72, 0.70], [0.86, 0.50], STEALN];
  const CARRIER = awayN.length - 1;               // away ball-carrier that gets robbed
  const seq = [6, 5, 8, 9];                       // CM → LM → LW → ST (after the steal)
  const GOALN = [0.985, 0.50];
  const segLabel = ["Spring forward", "Out to the wing", "Cut inside", "Shot on goal"];

  const STEAL1 = 0.12, SHOT0 = 0.62, SHOT1 = 0.80, GOAL0 = 0.80;

  const toX = nx => PX + nx * PW, toY = ny => PY + ny * PH;
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => (t = Math.max(0, Math.min(1, t))) < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const clamp01 = v => Math.max(0, Math.min(1, v));

  const SP = seq.map(i => [toX(homeN[i][0]), toY(homeN[i][1])]).concat([[toX(GOALN[0]), toY(GOALN[1])]]);
  const NSEG = SP.length - 1;                      // 3 passes + shot
  const SX = toX(STEALN[0]), SY = toY(STEALN[1]);

  const board = document.getElementById("kf-board");
  if (!board) return;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  board.querySelector(".board-stage").prepend(svg);
  const mk = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };

  svg.innerHTML = `<defs>
    <linearGradient id="pitchG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#13402b"/><stop offset=".55" stop-color="#0f3324"/><stop offset="1" stop-color="#0c2a1d"/></linearGradient>
    <radialGradient id="ballG" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cfd8e2"/></radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
    <radialGradient id="glowG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="rgba(255,235,150,.5)"/><stop offset="1" stop-color="rgba(255,235,150,0)"/></radialGradient>
  </defs>`;

  svg.appendChild(mk("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#pitchG)" }));
  const stripes = mk("g", { opacity: ".6" }), sw = PW / 12;
  for (let i = 0; i < 12; i++) stripes.appendChild(mk("rect", { x: PX + i * sw, y: PY, width: sw, height: PH, fill: i % 2 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.05)" }));
  svg.appendChild(stripes);

  const heatA = mk("g", { opacity: "0" });
  [[.16, .34, 140, "#2C6AD4"], [.28, .56, 170, "#3D7FC4"], [.44, .46, 150, "#46A069"], [.6, .5, 150, "#5B9BD8"], [.5, .7, 130, "#2C6AD4"], [.36, .24, 120, "#3D7FC4"]]
    .forEach(([x, y, r, c]) => heatA.appendChild(mk("circle", { cx: toX(x), cy: toY(y), r, fill: c, filter: "url(#soft)", opacity: ".5" })));
  const heatB = mk("g", { opacity: "0" });
  [[.86, .46, 150, "#B24A36"], [.72, .6, 170, "#D98A3D"], [.78, .34, 130, "#E8C76B"], [.6, .5, 140, "#D98A3D"], [.88, .66, 120, "#B24A36"], [.66, .74, 120, "#E8C76B"]]
    .forEach(([x, y, r, c]) => heatB.appendChild(mk("circle", { cx: toX(x), cy: toY(y), r, fill: c, filter: "url(#soft)", opacity: ".5" })));
  svg.appendChild(heatA); svg.appendChild(heatB);

  const lineCol = "rgba(255,255,255,.5)";
  const line = a => mk("rect", Object.assign({ fill: "none", stroke: lineCol, "stroke-width": 1.6 }, a));
  const lg = mk("g", {});
  lg.appendChild(line({ x: PX, y: PY, width: PW, height: PH, rx: 4 }));
  lg.appendChild(mk("line", { x1: PX + PW / 2, y1: PY, x2: PX + PW / 2, y2: PY + PH, stroke: lineCol, "stroke-width": 1.6 }));
  lg.appendChild(mk("circle", { cx: PX + PW / 2, cy: PY + PH / 2, r: 66, fill: "none", stroke: lineCol, "stroke-width": 1.6 }));
  lg.appendChild(mk("circle", { cx: PX + PW / 2, cy: PY + PH / 2, r: 3, fill: lineCol }));
  const boxH = PH * .55, box6 = PH * .24;
  lg.appendChild(line({ x: PX, y: PY + (PH - boxH) / 2, width: 112, height: boxH }));
  lg.appendChild(line({ x: PX, y: PY + (PH - box6) / 2, width: 46, height: box6 }));
  lg.appendChild(line({ x: PX + PW - 112, y: PY + (PH - boxH) / 2, width: 112, height: boxH }));
  lg.appendChild(line({ x: PX + PW - 46, y: PY + (PH - box6) / 2, width: 46, height: box6 }));
  svg.appendChild(lg);

  // goal net (right)
  const goalG = mk("g", { opacity: "0" });
  const gy0 = PY + (PH - box6 * 0.7) / 2, gy1 = PY + (PH + box6 * 0.7) / 2, gx = PX + PW, gd = 20;
  goalG.appendChild(mk("rect", { x: gx, y: gy0, width: gd, height: gy1 - gy0, fill: "rgba(255,255,255,.06)", stroke: "rgba(255,255,255,.7)", "stroke-width": 2 }));
  for (let i = 1; i < 5; i++) goalG.appendChild(mk("line", { x1: gx, y1: lerp(gy0, gy1, i / 5), x2: gx + gd, y2: lerp(gy0, gy1, i / 5), stroke: "rgba(255,255,255,.25)", "stroke-width": 1 }));
  for (let i = 1; i < 3; i++) goalG.appendChild(mk("line", { x1: gx + gd * i / 3, y1: gy0, x2: gx + gd * i / 3, y2: gy1, stroke: "rgba(255,255,255,.25)", "stroke-width": 1 }));
  const goalGlow = mk("circle", { cx: gx, cy: (gy0 + gy1) / 2, r: 60, fill: "url(#glowG)", opacity: "0" });
  svg.appendChild(goalGlow); svg.appendChild(goalG);

  const gPass = mk("g", {}); svg.appendChild(gPass);
  const gTrail = mk("g", {}); svg.appendChild(gTrail);
  const gAway = mk("g", {}); svg.appendChild(gAway);
  const gHome = mk("g", {}); svg.appendChild(gHome);
  const gFx = mk("g", {}); svg.appendChild(gFx);
  const gBall = mk("g", {}); svg.appendChild(gBall);

  const awayEls = awayN.map(([x, y], i) => { const d = mk("circle", { cx: toX(x), cy: toY(y), r: 11, fill: i === CARRIER ? "rgba(178,74,54,.6)" : "rgba(14,24,34,.55)", stroke: "rgba(255,255,255,.45)", "stroke-width": 1.6 }); gAway.appendChild(d); return { d, bx: toX(x), by: toY(y) }; });
  const homeEls = homeN.map(([x, y]) => {
    const g = mk("g", {});
    const halo = mk("circle", { cx: toX(x), cy: toY(y), r: 13, fill: "#46A069", opacity: "0" });
    const dot = mk("circle", { cx: toX(x), cy: toY(y), r: 11, fill: "#3F86E0", stroke: "#dbe8f9", "stroke-width": 1.8 });
    g.appendChild(halo); g.appendChild(dot); gHome.appendChild(g);
    return { dot, halo, bx: toX(x), by: toY(y) };
  });
  const ball = mk("circle", { r: 8, fill: "url(#ballG)", stroke: "rgba(14,24,34,.3)", "stroke-width": 1 });
  const ballGlow = mk("circle", { r: 16, fill: "url(#glowG)", opacity: "0" });
  gBall.appendChild(ballGlow); gBall.appendChild(ball);

  const labelEl = document.getElementById("kf-label");
  const elPasses = document.getElementById("kf-passes");
  const elPossA = document.getElementById("kf-poss-a"), elPossB = document.getElementById("kf-poss-b");
  const elFill = document.getElementById("kf-time-fill"), elNow = document.getElementById("kf-time-now");
  const modeBtns = Array.from(document.querySelectorAll(".board-mode"));

  function fwdShift(p) { return clamp01((p - STEAL1) / 0.55) * 22; }   // offense advances up the pitch
  function ballAt(p, fwd) {
    if (p < STEAL1) { const lt = easeIO(p / STEAL1); return { x: lerp(SX, SP[0][0], lt), y: lerp(SY, SP[0][1], lt), seg: -1, steal: true }; }
    if (p >= GOAL0) return { x: SP[NSEG][0], y: SP[NSEG][1], seg: NSEG - 1, goal: true };
    if (p >= SHOT0) { const lt = easeIO((p - SHOT0) / (SHOT1 - SHOT0)); return { x: lerp(SP[NSEG - 1][0] + fwd, SP[NSEG][0], lt), y: lerp(SP[NSEG - 1][1], SP[NSEG][1], lt), seg: NSEG - 1, shot: true }; }
    const passSegs = NSEG - 1, f = clamp01((p - STEAL1) / (SHOT0 - STEAL1)) * passSegs;
    const k = Math.min(passSegs - 1, Math.floor(f)), lt = easeIO(Math.min(1, f - k));
    return { x: lerp(SP[k][0], SP[k + 1][0], lt) + fwd, y: lerp(SP[k][1], SP[k + 1][1], lt), seg: k };
  }
  function completedSegs(p) {
    if (p < STEAL1) return -1; if (p >= GOAL0) return NSEG; if (p >= SHOT0) return NSEG - 1;
    const passSegs = NSEG - 1; return Math.floor(clamp01((p - STEAL1) / (SHOT0 - STEAL1)) * passSegs);
  }

  let trail = [], lastSeg = -2, target = 0, cur = 0, time0 = performance.now();
  let heatTeam = "both", aVis = 1, bVis = 1;
  window.KFBoard = { setProgress(p) { target = clamp01(p); } };
  const heatBtns = Array.from(document.querySelectorAll(".kf-heat-btn"));
  heatBtns.forEach(b => b.addEventListener("click", () => { heatTeam = b.dataset.team; heatBtns.forEach(x => x.classList.toggle("on", x === b)); }));

  function render(p) {
    const t = (performance.now() - time0) / 1000, fwd = fwdShift(p), b = ballAt(p, fwd);

    // home players: breathe + advance with the move
    homeEls.forEach((pl, i) => { const ox = Math.sin(t * 1.25 + i) * 3.4, oy = Math.cos(t * 1.0 + i * 1.7) * 3.2; pl.dot.setAttribute("cx", pl.bx + ox + fwd); pl.dot.setAttribute("cy", pl.by + oy); pl.halo.setAttribute("cx", pl.bx + ox + fwd); pl.halo.setAttribute("cy", pl.by + oy); });
    // away: gentle drift; carrier recoils once robbed
    awayEls.forEach((a, i) => {
      let ox = Math.sin(t * .9 + i) * 2.2, oy = Math.cos(t * .8 + i) * 2.2;
      if (i === CARRIER && p > 0.05) { ox -= clamp01((p - 0.05) / 0.12) * 18; oy += clamp01((p - 0.05) / 0.12) * 6; }
      else { const dx = b.x - a.bx, dy = b.y - a.by, d = Math.hypot(dx, dy), pull = d < 150 ? .14 : .05; ox += dx * pull; oy += dy * pull; }
      a.d.setAttribute("cx", a.bx + ox); a.d.setAttribute("cy", a.by + oy);
    });

    // passing network (completed)
    const done = completedSegs(p);
    while (gPass.firstChild) gPass.removeChild(gPass.firstChild);
    for (let k = 0; k < done && k < NSEG - 1; k++) gPass.appendChild(mk("line", { x1: SP[k][0] + fwd, y1: SP[k][1], x2: SP[k + 1][0] + fwd, y2: SP[k + 1][1], stroke: "rgba(120,180,250,.32)", "stroke-width": 2, "stroke-linecap": "round", "stroke-dasharray": "2 7" }));
    // active line
    if (b.steal) gPass.appendChild(mk("line", { x1: SX, y1: SY, x2: b.x, y2: b.y, stroke: "rgba(96,214,150,.95)", "stroke-width": 2.6, "stroke-linecap": "round" }));
    else if (!b.goal) { const a = b.shot ? [SP[NSEG - 1][0] + fwd, SP[NSEG - 1][1]] : [SP[b.seg][0] + fwd, SP[b.seg][1]]; gPass.appendChild(mk("line", { x1: a[0], y1: a[1], x2: b.x, y2: b.y, stroke: b.shot ? "rgba(255,225,130,.95)" : "rgba(150,200,255,.95)", "stroke-width": b.shot ? 3 : 2.4, "stroke-linecap": "round" })); }

    // steal spark
    while (gFx.firstChild) gFx.removeChild(gFx.firstChild);
    if (b.steal && p > 0.04) { const a = clamp01((p - 0.04) / 0.05) * (1 - clamp01((p - 0.1) / 0.04)); for (let i = 0; i < 6; i++) { const ang = i / 6 * 6.28 + t * 2; gFx.appendChild(mk("line", { x1: SX + Math.cos(ang) * 7, y1: SY + Math.sin(ang) * 7, x2: SX + Math.cos(ang) * 14, y2: SY + Math.sin(ang) * 14, stroke: `rgba(150,235,180,${0.8 * a})`, "stroke-width": 2, "stroke-linecap": "round" })); } }

    // ball + trail
    ball.setAttribute("cx", b.x); ball.setAttribute("cy", b.y); ballGlow.setAttribute("cx", b.x); ballGlow.setAttribute("cy", b.y);
    if (b.seg !== lastSeg) { trail = []; lastSeg = b.seg; }
    trail.push([b.x, b.y]); if (trail.length > 16) trail.shift();
    while (gTrail.firstChild) gTrail.removeChild(gTrail.firstChild);
    const tc = b.steal ? "96,214,150" : b.shot ? "255,220,120" : "150,200,255";
    trail.forEach((q, i) => { const a = i / trail.length; gTrail.appendChild(mk("circle", { cx: q[0], cy: q[1], r: 1.5 + a * 3.5, fill: `rgba(${tc},${a * .45})` })); });

    // receiver / winner highlight
    if (!b.goal) { const idx = b.steal ? seq[0] : seq[Math.min(seq.length - 1, b.seg + 1)]; const he = homeEls[idx]; if (he) he.halo.setAttribute("opacity", String(0.18 + 0.12 * Math.sin(t * 4))); }

    // goal
    const isGoal = p >= GOAL0;
    goalG.setAttribute("opacity", isGoal ? "1" : (p > SHOT0 + 0.04 ? "0.5" : "0"));
    if (isGoal) { const pulse = 0.5 + 0.5 * Math.sin(t * 8); goalGlow.setAttribute("opacity", String(0.4 + 0.5 * pulse)); ballGlow.setAttribute("opacity", String(0.5 * pulse)); board.classList.add("is-goal"); }
    else { goalGlow.setAttribute("opacity", "0"); ballGlow.setAttribute("opacity", "0"); board.classList.remove("is-goal"); }

    // heat reveal + team toggle
    const hv = easeIO(clamp01((p - 0.84) / 0.16));
    const wantA = (heatTeam === "team1" || heatTeam === "both") ? 1 : 0, wantB = (heatTeam === "team2" || heatTeam === "both") ? 1 : 0;
    aVis += (wantA - aVis) * 0.18; bVis += (wantB - bVis) * 0.18;
    heatA.setAttribute("opacity", String(hv * 0.85 * aVis)); heatB.setAttribute("opacity", String(hv * 0.85 * bVis));
    gHome.style.opacity = String(1 - hv * 0.5); gAway.style.opacity = String(1 - hv * 0.7);
    board.classList.toggle("show-heat", hv > 0.12);

    // label
    if (labelEl) { const lab = isGoal ? "Goal" : b.steal ? "Win the ball" : segLabel[Math.min(segLabel.length - 1, b.seg)]; labelEl.textContent = lab; labelEl.style.left = (b.x / W * 100) + "%"; labelEl.style.top = ((b.y - 30) / H * 100) + "%"; labelEl.classList.toggle("on", p > 0.01); }

    // stats
    if (elPasses) elPasses.textContent = 408 + Math.max(0, done);
    if (elPossA) { const a = 54 + Math.round(Math.sin(time0 + p * 6) * 2); elPossA.style.width = a + "%"; elPossB.style.width = (100 - a) + "%"; }
    if (elFill) elFill.style.width = (8 + p * 84) + "%";
    if (elNow) { const s = 35 * 60 + 2 + Math.floor(p * 70); elNow.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
    const phase = p < STEAL1 ? "tracking" : p < SHOT0 ? "passing" : p < 0.84 ? "tracking" : "heat";
    modeBtns.forEach(btn => btn.classList.toggle("on", btn.dataset.mode === phase));
  }

  function loop() { cur += (target - cur) * 0.18; if (Math.abs(target - cur) < 0.0004) cur = target; render(cur); requestAnimationFrame(loop); }
  render(0);
  if (reduce) render(0.5); else requestAnimationFrame(loop);

  modeBtns.forEach(b => b.addEventListener("click", () => { const m = b.dataset.mode; target = m === "passing" ? 0.4 : m === "tracking" ? 0.7 : 0.97; }));
})();
