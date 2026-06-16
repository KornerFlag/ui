/* PitchScene — blue/white tactical pitch that auto-plays a full move:
   build-up -> defensive challenge -> winger carry -> shot -> GOAL.
   Realistic markings, shaded players, ball with shadow. The element is rotated
   by the page on scroll (CSS); this just draws + loops the sequence. */

const L = 105, W = 68;
const HOME = [
  [7, 34, 1], [22, 55, 2], [19, 41, 5], [19, 27, 4], [22, 13, 3],
  [41, 34, 6], [43, 45, 8], [50, 27, 10], [70, 53, 7], [78, 34, 9], [70, 15, 11],
].map(([x, y, num]) => ({ x, y, num }));
const AWAY = HOME.map(p => ({ x: 105 - p.x, y: p.y, num: p.num }));
const SEQ = [2, 5, 3, 6, 7, 5, 8, 5, 10];
const CARRY = { x: 88, y: 18 };
const GOAL = { x: 105.4, y: 33 };
const ease = t => (t = Math.max(0, Math.min(1, t))) < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

// timeline windows
const CHAIN0 = 0.05, CHAIN1 = 0.60, CARRY1 = 0.74, SHOT1 = 0.90, CHAL0 = 0.40, CHAL1 = 0.52;

class PitchScene {
  constructor(canvas, opts = {}) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.o = Object.assign({ home: '#f4f7fb', away: '#2f6bdc', accent: '#eaf2ff', pad: 4 }, opts);
    this.t = 0; this.target = 0; this.time = 0; this.trail = []; this.last = performance.now(); this._tmap = {};
    this.passLabels = []; for (let i = 0; i < SEQ.length - 1; i++) this.passLabels.push(`#${HOME[SEQ[i]].num} → #${HOME[SEQ[i + 1]].num}`);
    this._build();
    this._resize = this._resize.bind(this); this._loop = this._loop.bind(this);
    window.addEventListener('resize', this._resize); this._resize();
    requestAnimationFrame(this._loop);
  }
  _fp(team, i, p) { const arr = team === 'home' ? HOME : AWAY, b = arr[i], e = ease(Math.min(1, p / 0.9)); return team === 'home' ? { x: Math.min(101, b.x + e * 18), y: b.y } : { x: b.x - e * 4, y: b.y + (34 - b.y) * e * 0.18 }; }
  _build() { this.keyP = []; this.keyPt = []; const N = SEQ.length; for (let k = 0; k < N; k++) { const p = CHAIN0 + (CHAIN1 - CHAIN0) * (k / (N - 1)); this.keyP.push(p); this.keyPt.push(this._fp('home', SEQ[k], p)); } this.chainEnd = this.keyP[N - 1]; }
  _ball(p) {
    if (p <= this.keyP[0]) return { x: this.keyPt[0].x, y: this.keyPt[0].y, lift: 0, seg: 0, phase: 'pass' };
    if (p <= this.chainEnd) { let k = 0; while (k < this.keyP.length - 2 && p > this.keyP[k + 1]) k++; const lt = (p - this.keyP[k]) / (this.keyP[k + 1] - this.keyP[k]); const a = this.keyPt[k], b = this.keyPt[k + 1]; return { x: lerp(a.x, b.x, ease(lt)), y: lerp(a.y, b.y, ease(lt)), lift: Math.sin(Math.PI * lt) * 0.8, seg: k, phase: 'pass' }; }
    if (p <= CARRY1) { const lt = (p - this.chainEnd) / (CARRY1 - this.chainEnd); const a = this.keyPt[this.keyPt.length - 1]; return { x: lerp(a.x, CARRY.x, ease(lt)), y: lerp(a.y, CARRY.y, ease(lt)), lift: 0, carry: true, phase: 'carry' }; }
    if (p <= SHOT1) { const lt = (p - CARRY1) / (SHOT1 - CARRY1), e = ease(lt); const bend = Math.sin(Math.PI * lt) * 4; return { x: lerp(CARRY.x, GOAL.x, e), y: lerp(CARRY.y, GOAL.y, e) + bend, lift: Math.sin(Math.PI * lt) * 1.4, shot: true, phase: 'shot' }; }
    return { x: GOAL.x, y: GOAL.y, lift: 0, goal: true, phase: 'goal' };
  }

  _resize() {
    const r = this.c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = r.width || 600; this.ch = r.height || 390;
    this.c.width = Math.round(this.cw * this.dpr); this.c.height = Math.round(this.ch * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const pad = Math.max(10, Math.min(this.cw, this.ch) * 0.05), aw = this.cw - 2 * pad, ah = this.ch - 2 * pad;
    this.scale = Math.min(aw / L, ah / W); this.fw = L * this.scale; this.fh = W * this.scale;
    this.ox = (this.cw - this.fw) / 2; this.oy = (this.ch - this.fh) / 2;
  }
  sx(x) { return this.ox + x * this.scale; } sy(y) { return this.oy + y * this.scale; } sl(d) { return d * this.scale; }

  setProgress(p) { this.target = Math.max(0, Math.min(1, p)); }
  _loop(now) {
    const dt = Math.min(0.04, (now - this.last) / 1000); this.last = now; this.time += dt;
    const prev = this.t;
    this.t += (this.target - this.t) * Math.min(1, dt * 9); // snappy ease to the scrolled position
    if (this.t < prev - 0.04) { this.trail = []; } // scrubbed backwards: clear ball trail
    this._render(this.t); requestAnimationFrame(this._loop);
  }

  _render(p) {
    const ctx = this.ctx; ctx.clearRect(0, 0, this.cw, this.ch); const ball = this._ball(p);
    this._grass(); this._lines();
    this._network(p); this._activePass(p, ball);
    this._team('away', p, ball);
    this._team('home', p, ball);
    if (p >= CHAL0 && p <= CHAL1) this._challenge(p, ball);
    if (!ball.goal) this._ball2(ball);
    if (ball.goal) this._goal();
    if (this.onTick) { let d = 0; for (let k = 0; k < this.keyP.length - 1; k++) if (p >= this.keyP[k + 1]) d++; const ph = ball.goal ? 'Goal!' : ball.shot ? 'Shot' : (p >= CHAL0 && p <= CHAL1) ? 'Challenge' : ball.carry ? 'Final third' : p < 0.2 ? 'Build-up' : 'Progression'; this.onTick({ phase: ph, completed: d, lastPass: this.passLabels[Math.max(0, d - 1)], score: ball.goal ? 1 : 0, progress: p }); }
  }

  _grass() {
    const ctx = this.ctx;
    // full-bleed base grass (markings sit inset, with a tasteful grass margin)
    const base = ctx.createLinearGradient(0, 0, 0, this.ch); base.addColorStop(0, '#3aa861'); base.addColorStop(0.55, '#2c9352'); base.addColorStop(1, '#1d7740');
    ctx.fillStyle = base; ctx.fillRect(0, 0, this.cw, this.ch);
    // refined mowing stripes aligned to pitch length
    ctx.save(); const n = 16; for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.038)' : 'rgba(0,0,0,0.045)'; ctx.fillRect(this.sx(i / n * L), 0, this.sl(L / n), this.ch); }
    ctx.restore();
    // soft top light sheen
    const sheen = ctx.createLinearGradient(0, 0, 0, this.ch * 0.55); sheen.addColorStop(0, 'rgba(255,255,255,0.09)'); sheen.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sheen; ctx.fillRect(0, 0, this.cw, this.ch * 0.55);
    // vignette for depth
    const v = ctx.createRadialGradient(this.cw * 0.56, this.ch * 0.44, this.ch * 0.18, this.cw * 0.5, this.ch * 0.5, this.cw * 0.74); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(2,16,8,0.26)'); ctx.fillStyle = v; ctx.fillRect(0, 0, this.cw, this.ch);
  }
  _lines() {
    const ctx = this.ctx; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.74)'; ctx.lineWidth = Math.max(1, this.sl(0.16)); ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,30,12,0.25)'; ctx.shadowBlur = Math.max(1, this.sl(0.3)); ctx.shadowOffsetY = Math.max(0.5, this.sl(0.12));
    ctx.strokeRect(this.sx(0), this.sy(0), this.fw, this.fh);
    ctx.beginPath(); ctx.moveTo(this.sx(L / 2), this.sy(0)); ctx.lineTo(this.sx(L / 2), this.sy(W)); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.sx(L / 2), this.sy(W / 2), this.sl(9.15), 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.82)'; ctx.beginPath(); ctx.arc(this.sx(L / 2), this.sy(34), this.sl(0.32), 0, 7); ctx.fill();
    this._end(0); this._end(L); this._corners(); ctx.restore();
  }
  _end(endX) {
    const ctx = this.ctx, left = endX === 0, dir = left ? 1 : -1;
    const penX = endX + dir * 16.5, sixX = endX + dir * 5.5, spotX = endX + dir * 11;
    ctx.beginPath(); ctx.moveTo(this.sx(endX), this.sy(13.84)); ctx.lineTo(this.sx(penX), this.sy(13.84)); ctx.lineTo(this.sx(penX), this.sy(54.16)); ctx.lineTo(this.sx(endX), this.sy(54.16)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(this.sx(endX), this.sy(24.84)); ctx.lineTo(this.sx(sixX), this.sy(24.84)); ctx.lineTo(this.sx(sixX), this.sy(43.16)); ctx.lineTo(this.sx(endX), this.sy(43.16)); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.sx(spotX), this.sy(34), this.sl(0.32), 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(this.sx(spotX), this.sy(34), this.sl(9.15), left ? -0.93 : Math.PI - 0.93, left ? 0.93 : Math.PI + 0.93); ctx.stroke();
    ctx.save(); ctx.lineWidth = Math.max(1.6, this.sl(0.28)); ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.moveTo(this.sx(endX), this.sy(30.34)); ctx.lineTo(this.sx(endX - dir * 1.6), this.sy(30.34)); ctx.lineTo(this.sx(endX - dir * 1.6), this.sy(37.66)); ctx.lineTo(this.sx(endX), this.sy(37.66)); ctx.stroke(); ctx.restore();
  }
  _corners() { const ctx = this.ctx, r = this.sl(1); [[0, 0, 0, 0.5], [L, 0, 0.5, 1], [0, W, 1.5, 2], [L, W, 1, 1.5]].forEach(([x, y, a, b]) => { ctx.beginPath(); ctx.arc(this.sx(x), this.sy(y), r, a * Math.PI, b * Math.PI); ctx.stroke(); }); }
  _network(p) { const ctx = this.ctx; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.26)'; ctx.lineWidth = 1; ctx.setLineDash([this.sl(0.8), this.sl(1)]); for (let k = 0; k < this.keyP.length - 1; k++) { if (p < this.keyP[k + 1]) break; const a = this.keyPt[k], b = this.keyPt[k + 1]; ctx.beginPath(); ctx.moveTo(this.sx(a.x), this.sy(a.y)); ctx.lineTo(this.sx(b.x), this.sy(b.y)); ctx.stroke(); } ctx.setLineDash([]); ctx.restore(); }
  _activePass(p, ball) {
    if (p <= this.keyP[0] || ball.carry || ball.goal) return; const ctx = this.ctx;
    const a = ball.shot ? CARRY : this.keyPt[ball.seg];
    const ax = this.sx(a.x), ay = this.sy(a.y), bx = this.sx(ball.x), by = this.sy(ball.y - ball.lift * 0);
    const g = ctx.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, 'rgba(207,224,255,0)'); g.addColorStop(1, ball.shot ? 'rgba(255,240,170,0.95)' : 'rgba(220,235,255,0.95)');
    ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = Math.max(1.6, this.sl(ball.shot ? 0.4 : 0.32)); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.restore();
  }
  _team(team, p, ball) {
    const recv = team === 'home' ? this._recv(p) : -1, fill = team === 'home' ? this.o.home : this.o.away, numCol = team === 'home' ? '#15306e' : '#fff';
    for (let i = 0; i < (team === 'home' ? HOME : AWAY).length; i++) {
      const pos = this._fp(team, i, p);
      let x = pos.x + Math.sin(this.time * 1.05 + i) * 0.13, y = pos.y + Math.cos(this.time * 0.9 + i * 1.7) * 0.13;
      if (team === 'away') { const press = i === this._near(ball) ? 0.4 : 0.12; x += (ball.x - x) * press * ease(p); y += (ball.y - y) * press * 0.6 * ease(p); }
      this._player(this.sx(x), this.sy(y), fill, numCol, (team === 'home' ? HOME : AWAY)[i].num, i === recv);
    }
  }
  _recv(p) { if (p > this.chainEnd) return SEQ[SEQ.length - 1]; let k = 0; while (k < this.keyP.length - 2 && p > this.keyP[k + 1]) k++; return SEQ[k + 1]; }
  _near(ball) { let bi = 1, bd = 1e9; for (let i = 1; i < AWAY.length; i++) { const b = AWAY[i], d = Math.hypot(b.x - ball.x, b.y - ball.y); if (d < bd) { bd = d; bi = i; } } return bi; }
  _player(cx, cy, fill, numCol, jersey, hi) {
    const ctx = this.ctx, r = Math.max(5, this.sl(1.4)); ctx.save();
    ctx.fillStyle = 'rgba(8,20,46,0.34)'; ctx.beginPath(); ctx.ellipse(cx + r * 0.16, cy + r * 0.62, r * 0.96, r * 0.42, 0, 0, 7); ctx.fill();
    if (hi) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, r + 3.2, 0, 7); ctx.stroke(); }
    const g = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.5, r * 0.2, cx, cy, r * 1.15); g.addColorStop(0, this._lighten(fill, 0.3)); g.addColorStop(1, this._lighten(fill, -0.14));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.strokeStyle = this._lighten(fill, -0.4); ctx.lineWidth = 1; ctx.stroke();
    if (r > 7.5) { ctx.fillStyle = numCol; ctx.font = `600 ${Math.round(r * 0.9)}px "IBM Plex Mono",monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.95; ctx.fillText(jersey, cx, cy + 0.4); }
    ctx.restore();
  }
  _challenge(p, ball) {
    const ctx = this.ctx, di = this._near(ball), b = AWAY[di];
    const lt = (p - CHAL0) / (CHAL1 - CHAL0);
    const sx = lerp(b.x, ball.x - 1.6, ease(lt)), sy = lerp(b.y, ball.y + 1.2, ease(lt));
    // slide streak
    ctx.save(); ctx.strokeStyle = 'rgba(207,224,255,0.5)'; ctx.lineWidth = Math.max(2.4, this.sl(1)); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(this.sx(b.x), this.sy(b.y)); ctx.lineTo(this.sx(sx), this.sy(sy)); ctx.stroke();
    // impact spark near ball
    if (lt > 0.6) { const ix = this.sx(ball.x), iy = this.sy(ball.y); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.4; for (let a = 0; a < 6; a++) { const ang = a / 6 * 6.28 + this.time; ctx.beginPath(); ctx.moveTo(ix + Math.cos(ang) * 5, iy + Math.sin(ang) * 5); ctx.lineTo(ix + Math.cos(ang) * 9, iy + Math.sin(ang) * 9); ctx.stroke(); } }
    // label
    const lx = this.sx(b.x) - 30, ly = this.sy(b.y) + 14; ctx.globalAlpha = Math.sin(Math.PI * lt); ctx.fillStyle = 'rgba(10,22,40,0.85)'; this._rr(lx, ly, 70, 17, 5); ctx.fill(); ctx.fillStyle = '#cfe0ff'; ctx.font = '600 8px "IBM Plex Mono",monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('● CHALLENGE', lx + 8, ly + 9); ctx.restore();
  }
  _ball2(ball) {
    const ctx = this.ctx, lift = ball.lift * Math.min(16, this.sl(8)), bx = this.sx(ball.x), by = this.sy(ball.y) - lift, r = Math.max(2.6, this.sl(0.82));
    this.trail.push([bx, by]); if (this.trail.length > 9) this.trail.shift();
    ctx.save();
    for (let k = 1; k < this.trail.length; k++) { const a = k / this.trail.length; ctx.strokeStyle = `rgba(255,255,255,${a * 0.3})`; ctx.lineWidth = a * 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(this.trail[k - 1][0], this.trail[k - 1][1]); ctx.lineTo(this.trail[k][0], this.trail[k][1]); ctx.stroke(); }
    ctx.fillStyle = 'rgba(8,20,46,0.32)'; ctx.beginPath(); ctx.ellipse(bx, this.sy(ball.y) + r * 0.5, r * 1.1, r * 0.5, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(bx - r * 0.4, by - r * 0.5, 0, bx, by, r); g.addColorStop(0, '#fff'); g.addColorStop(1, '#cfd8e6'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(30,40,55,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.restore();
  }
  _goal() {
    const ctx = this.ctx, gx = this.sx(105), top = this.sy(30.34), bot = this.sy(37.66), depth = this.sl(2.2);
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 8);
    ctx.save();
    // net ripple
    ctx.strokeStyle = `rgba(255,255,255,${0.4 + 0.3 * pulse})`; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) { const yy = lerp(top, bot, i / 5); ctx.beginPath(); ctx.moveTo(gx, yy); ctx.lineTo(gx + depth, yy + Math.sin(this.time * 6 + i) * 2); ctx.stroke(); }
    for (let i = 0; i <= 3; i++) { const xx = gx + depth * (i / 3); ctx.beginPath(); ctx.moveTo(xx, top); ctx.lineTo(xx, bot); ctx.stroke(); }
    // ball in net
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(gx + depth * 0.5, lerp(top, bot, 0.5), Math.max(2.6, this.sl(0.82)), 0, 7); ctx.fill();
    // glow
    const glow = ctx.createRadialGradient(gx, this.sy(34), 0, gx, this.sy(34), this.sl(16)); glow.addColorStop(0, `rgba(255,240,170,${0.3 * pulse})`); glow.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(gx, this.sy(34), this.sl(16), 0, 7); ctx.fill();
    // GOAL label
    const lx = this.sx(74), ly = this.sy(8); ctx.fillStyle = 'rgba(10,22,40,0.9)'; this._rr(lx, ly, 58, 22, 6); ctx.fill(); ctx.fillStyle = '#ffe9a6'; ctx.font = '700 13px "Space Grotesk","Inter",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GOAL', lx + 29, ly + 12);
    ctx.restore();
  }
  _rr(x, y, w, h, r) { const c = this.ctx; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  _lighten(hex, amt) { const h = hex.replace('#', ''); let n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const f = c => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt)))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
}
window.PitchScene = PitchScene;
