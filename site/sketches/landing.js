/* ScrollPitch — a scrubbable tactical board for the Korner Flags scroll story.
   The board is sticky; scroll progress (0..1) drives a single choreographed
   build-up: ball progresses, passes draw into a network, the attack reaches the
   final third, a review-clip marker pops, and a heatmap can fade in. In the hero
   (no scroll yet) it plays a calm idle loop so it always feels alive. */

const L = 105, W = 68;
const F = {
  home: [ // attacking -> right
    ['GK', 7, 34], ['LB', 22, 13], ['LCB', 19, 27], ['RCB', 19, 41], ['RB', 22, 55],
    ['LCM', 43, 23], ['CM', 41, 34], ['RCM', 43, 45], ['LW', 68, 15], ['ST', 77, 34], ['RW', 68, 53],
  ].map(([r, x, y], i) => ({ role: r, x, y, num: [1, 3, 5, 6, 2, 8, 4, 10, 11, 9, 7][i] })),
  away: null,
};
F.away = F.home.map(p => ({ role: p.role, x: 105 - p.x, y: p.y, num: p.num }));

const SEQ = [0, 2, 6, 5, 7, 9, 8, 9]; // home indices: build-up chain
function ease(t) { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function lerp(a, b, t) { return a + (b - a) * t; }

class ScrollPitch {
  constructor(canvas, opts = {}) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.o = Object.assign({
      home: '#5C9CE6', away: '#E8C76B', line: 'rgba(236,244,253,0.6)',
      grass: ['#236f4d', '#15543a'], heatColor: '#5C9CE6', pad: 30,
    }, opts);
    this.GX = 9; this.GY = 14; this.grid = Array.from({ length: this.GX }, () => new Array(this.GY).fill(0));
    this.scroll = 0; this.heroActive = true; this.actual = 0; this.heatAlpha = 0; this.heatTarget = 0;
    this.time = 0; this.idle = 0;
    this._build();
    this.last = performance.now();
    this._resize = this._resize.bind(this); this._loop = this._loop.bind(this);
    window.addEventListener('resize', this._resize); this._resize();
    requestAnimationFrame(this._loop);
  }
  _fp(team, idx, p) { // formation position at progress p
    const b = F[team][idx], e = ease(p);
    if (team === 'home') return { x: Math.min(101, b.x + e * 20), y: b.y };
    return { x: b.x - e * 5, y: b.y + (34 - b.y) * e * 0.22 };
  }
  _build() {
    this.keyP = []; this.keyPt = [];
    const N = SEQ.length;
    for (let k = 0; k < N; k++) {
      const p = 0.06 + 0.78 * (k / (N - 1));
      this.keyP.push(p); this.keyPt.push(this._fp('home', SEQ[k], p));
    }
    this.chainEnd = this.keyP[N - 1]; // 0.84
    this.goal = { x: 104, y: 34 };
  }
  _ball(p) {
    if (p <= this.keyP[0]) return { x: this.keyPt[0].x, y: this.keyPt[0].y, lift: 0, seg: -1 };
    if (p <= this.chainEnd) {
      let k = 0; while (k < this.keyP.length - 2 && p > this.keyP[k + 1]) k++;
      const lt = (p - this.keyP[k]) / (this.keyP[k + 1] - this.keyP[k]);
      const a = this.keyPt[k], b = this.keyPt[k + 1];
      return { x: lerp(a.x, b.x, ease(lt)), y: lerp(a.y, b.y, ease(lt)), lift: Math.sin(Math.PI * lt), seg: k };
    }
    const lt = (p - this.chainEnd) / (1 - this.chainEnd);
    const a = this.keyPt[this.keyPt.length - 1];
    return { x: lerp(a.x, this.goal.x, ease(lt)), y: lerp(a.y, this.goal.y, ease(lt)), lift: Math.sin(Math.PI * lt) * 1.4, seg: 99 };
  }
  setScroll(progress, heroActive) { this.scroll = progress; this.heroActive = heroActive; }
  setHeat(v) { this.heatTarget = v ? 1 : 0; }

  _resize() {
    const r = this.c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = r.width; this.ch = r.height;
    this.c.width = Math.round(r.width * this.dpr); this.c.height = Math.round(r.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  sx(x) { const p = this.o.pad; return p + (x / L) * (this.cw - 2 * p); }
  sy(y) { const p = this.o.pad; return p + (y / W) * (this.ch - 2 * p); }
  sl(d) { const p = this.o.pad; return (d / L) * (this.cw - 2 * p); }

  _loop(now) {
    const dt = Math.min(0.04, (now - this.last) / 1000); this.last = now; this.time += dt;
    // target progress: hero -> calm idle loop; else scroll
    let target;
    if (this.heroActive) { this.idle += dt * 0.16; target = 0.03 + 0.085 * (0.5 + 0.5 * Math.sin(this.idle)); }
    else target = this.scroll;
    this.actual += (target - this.actual) * Math.min(1, dt * 3.5);
    this.heatAlpha += (this.heatTarget - this.heatAlpha) * Math.min(1, dt * 2.5);
    this._render(this.actual);
    requestAnimationFrame(this._loop);
  }

  _render(p) {
    const ctx = this.ctx; ctx.clearRect(0, 0, this.cw, this.ch);
    const ball = this._ball(p);
    this._grass();
    // final-third highlight
    if (ball.x > 70) {
      ctx.save(); ctx.globalAlpha = Math.min(1, (ball.x - 70) / 14) * 0.16;
      ctx.fillStyle = this.o.home;
      ctx.fillRect(this.sx(70), this.sy(0), this.sx(105) - this.sx(70), this.sy(W) - this.sy(0));
      ctx.restore();
    }
    if (this.heatAlpha > 0.02) this._heat();
    this._lines();
    this._network(p);
    // players
    for (const team of ['home', 'away']) {
      const col = team === 'home' ? this.o.home : this.o.away;
      const dark = team === 'home' ? '#11365f' : '#7a5a16';
      for (let i = 0; i < F[team].length; i++) {
        let pos = this._fp(team, i, p);
        const jx = Math.sin(this.time * 1.5 + i) * 0.25, jy = Math.cos(this.time * 1.3 + i * 1.7) * 0.25;
        let x = pos.x + jx, y = pos.y + jy;
        if (team === 'away') { // defenders drift toward ball
          const press = i === this._nearestAway(ball) ? 0.5 : 0.16;
          x += (ball.x - x) * press * ease(p); y += (ball.y - y) * press * 0.6 * ease(p);
        }
        this.grid[Math.min(this.GX - 1, Math.max(0, Math.floor(y / W * this.GX)))]
                 [Math.min(this.GY - 1, Math.max(0, Math.floor(x / L * this.GY)))] += team === 'home' ? 1 : 0;
        this._dot(this.sx(x), this.sy(y), col, dark, F[team][i].num, team === 'home');
      }
    }
    // ball
    this._ballGfx(ball);
    // review-clip marker near the end
    if (p > 0.9) this._reviewMarker(ball, Math.min(1, (p - 0.9) / 0.08));

    if (this.onTick) this.onTick(this._stats(p));
  }
  _nearestAway(ball) {
    let bi = 1, bd = 1e9;
    for (let i = 1; i < F.away.length; i++) { const b = F.away[i]; const d = Math.hypot(b.x - ball.x, b.y - ball.y); if (d < bd) { bd = d; bi = i; } }
    return bi;
  }
  _stats(p) {
    let passes = 0; for (let k = 0; k < this.keyP.length - 1; k++) if (p >= this.keyP[k + 1]) passes++;
    const phase = p < 0.2 ? 'Build-up' : p < 0.55 ? 'Progression' : p < 0.86 ? 'Final third' : 'Shot · review';
    const poss = 60 + 3 * Math.sin(p * 6); // hovers ~57-63
    return { passes, phase, possession: Math.round(poss * 10) / 10,
      finalThird: p > 0.62 ? 1 : 0, reviewClips: p > 0.9 ? 1 : 0, progress: p };
  }

  // ---------- drawing ----------
  _grass() {
    const ctx = this.ctx, p = this.o.pad;
    const g = ctx.createLinearGradient(0, p, 0, this.ch - p);
    g.addColorStop(0, this.o.grass[0]); g.addColorStop(1, this.o.grass[1]);
    ctx.fillStyle = g; this._rr(p, p, this.cw - 2 * p, this.ch - 2 * p, 18); ctx.fill();
    ctx.save(); this._rr(p, p, this.cw - 2 * p, this.ch - 2 * p, 18); ctx.clip();
    const n = 12;
    for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'; ctx.fillRect(this.sx(i / n * L), p, this.sl(L / n), this.ch - 2 * p); }
    const v = ctx.createRadialGradient(this.cw / 2, this.ch / 2, this.ch * 0.15, this.cw / 2, this.ch / 2, this.cw * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, this.cw, this.ch); ctx.restore();
  }
  _lines() {
    const ctx = this.ctx; ctx.strokeStyle = this.o.line; ctx.lineWidth = 1.6;
    this._rr(this.sx(0), this.sy(0), this.sl(L), this.sy(W) - this.sy(0), 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(this.sx(L / 2), this.sy(0)); ctx.lineTo(this.sx(L / 2), this.sy(W)); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.sx(L / 2), this.sy(W / 2), this.sl(9.15), 0, 7); ctx.stroke();
    ctx.fillStyle = this.o.line; ctx.beginPath(); ctx.arc(this.sx(L / 2), this.sy(W / 2), 2.5, 0, 7); ctx.fill();
    this._goal(0); this._goal(L);
  }
  _goal(endX) {
    const ctx = this.ctx, left = endX === 0;
    const xPen = left ? 16.5 : L - 16.5, xSix = left ? 5.5 : L - 5.5;
    const pen = [34 - 20.15, 34 + 20.15], six = [34 - 9.16, 34 + 9.16];
    ctx.beginPath();
    ctx.moveTo(this.sx(endX), this.sy(pen[0])); ctx.lineTo(this.sx(xPen), this.sy(pen[0]));
    ctx.lineTo(this.sx(xPen), this.sy(pen[1])); ctx.lineTo(this.sx(endX), this.sy(pen[1])); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.sx(endX), this.sy(six[0])); ctx.lineTo(this.sx(xSix), this.sy(six[0]));
    ctx.lineTo(this.sx(xSix), this.sy(six[1])); ctx.lineTo(this.sx(endX), this.sy(six[1])); ctx.stroke();
    const spot = left ? 11 : L - 11;
    ctx.beginPath(); ctx.arc(this.sx(spot), this.sy(34), 2, 0, 7); ctx.fill();
    ctx.beginPath(); const a0 = left ? -0.9 : Math.PI - 0.9, a1 = left ? 0.9 : Math.PI + 0.9;
    ctx.arc(this.sx(spot), this.sy(34), this.sl(9.15), a0, a1); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(this.sx(endX), this.sy(34 - 3.66)); ctx.lineTo(this.sx(endX), this.sy(34 + 3.66)); ctx.stroke(); ctx.lineWidth = 1.6;
  }
  _heat() {
    const ctx = this.ctx; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    let mx = 1; for (const r of this.grid) for (const v of r) if (v > mx) mx = v;
    const rad = this.sl(L) / this.GY * 1.8;
    for (let i = 0; i < this.GX; i++) for (let j = 0; j < this.GY; j++) {
      const v = this.grid[i][j] / mx; if (v < 0.1) continue;
      const cx = this.sx((j + 0.5) / this.GY * L), cy = this.sy((i + 0.5) / this.GX * W);
      const a = Math.pow(v, 1.25) * 0.5 * this.heatAlpha;
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      rg.addColorStop(0, this._rgba(this.o.heatColor, a)); rg.addColorStop(1, this._rgba(this.o.heatColor, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  _network(p) {
    const ctx = this.ctx; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5;
    for (let k = 0; k < this.keyP.length - 1; k++) {
      if (p < this.keyP[k + 1]) break;
      const a = this.keyPt[k], b = this.keyPt[k + 1];
      ctx.strokeStyle = this._rgba(this.o.home, 0.32);
      ctx.beginPath(); ctx.moveTo(this.sx(a.x), this.sy(a.y)); ctx.lineTo(this.sx(b.x), this.sy(b.y)); ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  _dot(cx, cy, col, dark, num, home) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx, cy + 7, 7, 3, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(cx - 2, cy - 3, 1, cx, cy, 8.5);
    g.addColorStop(0, col); g.addColorStop(1, dark);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 8.5, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.fillStyle = home ? '#fff' : '#3a2a06'; ctx.font = '600 9px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(num, cx, cy + 0.5);
  }
  _ballGfx(ball) {
    const ctx = this.ctx; const lift = ball.lift * Math.min(30, this.sl(16));
    const bx = this.sx(ball.x), by = this.sy(ball.y) - lift;
    ctx.shadowColor = 'rgba(255,255,255,0.7)'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, 4.5, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  }
  _reviewMarker(ball, a) {
    const ctx = this.ctx; const bx = this.sx(ball.x), by = this.sy(ball.y);
    ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6;
    ctx.strokeRect(bx - 26, by - 40, 52, 26);
    ctx.fillStyle = 'rgba(8,22,37,0.82)'; this._rr(bx - 26, by - 40, 52, 26, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '600 8px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillText('▶ CLIP', bx, by - 24);
    ctx.globalAlpha = 1;
  }
  _rr(x, y, w, h, r) { const c = this.ctx; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  _rgba(hex, a) { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
}
window.ScrollPitch = ScrollPitch;
