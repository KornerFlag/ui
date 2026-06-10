/* MatchAnim — a realistic, choreographed full-pitch passing animation for the
   Korner Flags landing hero. Full pitch (105 x 68 m), two 4-3-3 sides, a ball
   that travels passing lanes with arcs + comet trail, a passing network that
   builds up, live possession + pass-accuracy, off-ball runs and pressing.
   Designed to LOOK like a real tactical-cam broadcast, not raw noisy data. */

const L = 105, W = 68;

const HOME = [ // attacking -> right
  ['GK', 6, 34, 1], ['LB', 20, 12, 3], ['LCB', 17, 27, 5], ['RCB', 17, 41, 6], ['RB', 20, 56, 2],
  ['LCM', 42, 22, 8], ['CM', 40, 34, 6], ['RCM', 42, 46, 10], ['LW', 70, 13, 11], ['ST', 78, 34, 9], ['RW', 70, 55, 7],
];
const AWAY = HOME.map(([r, x, y, n]) => [r, 105 - x, y, n]); // mirror, defends right goal

function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

class MatchAnim {
  constructor(canvas, opts = {}) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.o = Object.assign({
      home: '#5C9CE6', away: '#E8C76B', line: 'rgba(236,244,253,0.62)',
      grass: ['#1f7a52', '#135e3f'], heat: 'home',
      heatHome: '#4F86C6', heatAway: '#E8C76B', pad: 30,
    }, opts);
    this.players = {
      home: HOME.map(p => ({ role: p[0], base: { x: p[1], y: p[2] }, pos: { x: p[1], y: p[2] }, num: p[3] })),
      away: AWAY.map(p => ({ role: p[0], base: { x: p[1], y: p[2] }, pos: { x: p[1], y: p[2] }, num: p[3] })),
    };
    // playlist of build-ups (indices into team arrays)
    this.plays = [
      { team: 'home', seq: [0, 2, 6, 5, 8, 9], end: 'shot' },
      { team: 'away', seq: [0, 1, 6, 8], end: 'turnover' },
      { team: 'home', seq: [6, 7, 10, 9], end: 'shot' },
      { team: 'home', seq: [0, 4, 7, 9, 8], end: 'shot' },
    ];
    this.GX = 9; this.GY = 14;
    this.grid = { home: this._zeros(), away: this._zeros() };
    this.network = []; // {team, a:{x,y}, b:{x,y}}
    this.ball = { x: 6, y: 34, vis: { x: 6, y: 34 } };
    this.trail = [];
    this.flashes = [];
    this.posTime = { home: 0.621, away: 0.379 }; // seed near the real clip number
    this.stats = { passes: 0, turnovers: 0, lastPass: '—', acc: 100 };
    this.time = 0;
    this._startPlay(0);
    this.last = performance.now();
    this._resize = this._resize.bind(this); this._loop = this._loop.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize(); requestAnimationFrame(this._loop);
  }

  _zeros() { return Array.from({ length: this.GX }, () => new Array(this.GY).fill(0)); }
  setHeat(m) { this.o.heat = m; }

  _resize() {
    const r = this.c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = r.width; this.ch = r.height;
    this.c.width = Math.round(r.width * this.dpr); this.c.height = Math.round(r.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  sx(x) { const p = this.o.pad; return p + (x / L) * (this.cw - 2 * p); }
  sy(y) { const p = this.o.pad; return p + (y / W) * (this.ch - 2 * p); }
  sl(d) { const p = this.o.pad; return (d / L) * (this.cw - 2 * p); } // length->px

  // ---------- choreography ----------
  _startPlay(i) {
    this.playIdx = i % this.plays.length;
    const play = this.plays[this.playIdx];
    this.atk = play.team; this.def = play.team === 'home' ? 'away' : 'home';
    this.passIdx = 0; this.phase = 'hold'; this.timer = 0.5;
    this.carrier = play.seq[0];
    const c = this.players[this.atk][this.carrier].pos;
    this.ball.x = c.x; this.ball.y = c.y;
  }
  _beginPass() {
    const play = this.plays[this.playIdx];
    this.from = { ...this.players[this.atk][this.carrier].pos };
    if (this.passIdx + 1 < play.seq.length) {
      this.target = this.players[this.atk][play.seq[this.passIdx + 1]].pos;
      this.toIdx = play.seq[this.passIdx + 1];
    } else { // final action
      this.target = play.end === 'shot'
        ? { x: this.atk === 'home' ? 104 : 1, y: 34 }
        : { x: this.players[this.def][0].pos.x, y: 34 };
      this.toIdx = -1;
    }
    const d = Math.hypot(this.target.x - this.from.x, this.target.y - this.from.y);
    this.passDur = Math.min(1.2, 0.4 + d / 70);
    this.phase = 'flight'; this.timer = 0;
  }
  _completePass() {
    const play = this.plays[this.playIdx];
    const to = { x: this.ball.x, y: this.ball.y };
    if (this.toIdx >= 0) {
      this.network.push({ team: this.atk, a: this.from, b: { ...to } });
      if (this.network.length > 16) this.network.shift();
      this.stats.passes++;
      const fromNum = this.players[this.atk][this.carrier].num;
      const toNum = this.players[this.atk][this.toIdx].num;
      this.stats.lastPass = `#${fromNum} → #${toNum}`;
      this.flashes.push({ x: to.x, y: to.y, ttl: 0.9, kind: 'pass' });
      this.carrier = this.toIdx; this.passIdx++;
      this.phase = 'hold'; this.timer = 0.28 + Math.random() * 0.2;
    } else {
      if (play.end === 'shot') this.flashes.push({ x: to.x, y: to.y, ttl: 1.1, kind: 'shot' });
      else { this.flashes.push({ x: to.x, y: to.y, ttl: 1.1, kind: 'turnover' }); this.stats.turnovers++; }
      this.phase = 'reset'; this.timer = 0.9;
    }
    const tot = this.stats.passes + this.stats.turnovers;
    this.stats.acc = tot ? Math.round((this.stats.passes / tot) * 100) : 100;
  }

  _update(dt) {
    this.time += dt;
    // possession eases toward a realistic target based on who's on the ball
    const target = this.atk === 'home' ? 0.66 : 0.57; // home leads the match ~62/38
    this.posTime.home += (target - this.posTime.home) * 0.4 * dt;
    this.posTime.away = 1 - this.posTime.home;

    if (this.phase === 'hold') {
      this.timer -= dt;
      if (this.timer <= 0) this._beginPass();
    } else if (this.phase === 'flight') {
      this.timer += dt;
      const t = Math.min(1, this.timer / this.passDur);
      const e = ease(t);
      this.ball.x = this.from.x + (this.target.x - this.from.x) * e;
      this.ball.y = this.from.y + (this.target.y - this.from.y) * e;
      this.ballLift = 4 * t * (1 - t); // 0..1 for arc in screen
      if (t >= 1) { this.ballLift = 0; this._completePass(); }
    } else if (this.phase === 'reset') {
      this.timer -= dt;
      if (this.timer <= 0) { this.network = []; this.flashes = []; this._startPlay(this.playIdx + 1); }
    }
    // ball visual lerp + trail
    this.ball.vis.x += (this.ball.x - this.ball.vis.x) * 0.5;
    this.ball.vis.y += (this.ball.y - this.ball.vis.y) * 0.5;
    this.trail.push({ x: this.ball.vis.x, y: this.ball.vis.y });
    if (this.trail.length > 18) this.trail.shift();

    // player motion
    const play = this.plays[this.playIdx];
    const prog = play.seq.length ? this.passIdx / play.seq.length : 0;
    const dir = this.atk === 'home' ? 1 : -1;
    for (const team of ['home', 'away']) {
      const attacking = team === this.atk;
      this.players[team].forEach((pl, i) => {
        let tx = pl.base.x, ty = pl.base.y;
        if (attacking) {
          tx += dir * prog * 16;                       // push up the pitch
          if (i === this.carrier && this.phase !== 'flight') { tx = this.ball.x; ty = this.ball.y; }
          if (i === this.toIdx && this.phase === 'flight') { tx = this.target.x; ty = this.target.y; } // make the run
        } else {
          tx += (this.ball.x - tx) * 0.18;             // compress toward ball
          ty += (this.ball.y - ty) * 0.10;
        }
        // nearest defender presses the ball
        const jx = Math.sin(this.time * 1.6 + i) * 0.18, jy = Math.cos(this.time * 1.4 + i * 1.7) * 0.18;
        pl.pos.x += (tx - pl.pos.x) * 0.05 + jx * dt;
        pl.pos.y += (ty - pl.pos.y) * 0.05 + jy * dt;
        pl.pos.x = Math.max(1, Math.min(L - 1, pl.pos.x));
        pl.pos.y = Math.max(1, Math.min(W - 1, pl.pos.y));
      });
    }
    // closest defender extra pressure
    const carrierPos = this.players[this.atk][this.carrier].pos;
    let best = 0, bd = 1e9;
    this.players[this.def].forEach((pl, i) => {
      const d = Math.hypot(pl.pos.x - carrierPos.x, pl.pos.y - carrierPos.y);
      if (i > 0 && d < bd) { bd = d; best = i; }
    });
    const dp = this.players[this.def][best].pos;
    dp.x += (carrierPos.x - dp.x) * 0.04; dp.y += (carrierPos.y - dp.y) * 0.04;

    // heatmap accumulation
    if (!this._hk) this._hk = 0; this._hk += dt;
    if (this._hk > 0.08) {
      this._hk = 0;
      for (const team of ['home', 'away']) {
        for (const pl of this.players[team]) {
          const gx = Math.min(this.GX - 1, Math.max(0, Math.floor(pl.pos.y / W * this.GX)));
          const gy = Math.min(this.GY - 1, Math.max(0, Math.floor(pl.pos.x / L * this.GY)));
          this.grid[team][gx][gy] += 1;
        }
      }
    }
    // flashes
    this.flashes.forEach(f => f.ttl -= dt);
    this.flashes = this.flashes.filter(f => f.ttl > 0);

    if (this.onTick) this.onTick({
      poss: [Math.round(this.posTime.home * 1000) / 10, Math.round(this.posTime.away * 1000) / 10],
      passes: this.stats.passes, acc: this.stats.acc, lastPass: this.stats.lastPass,
    });
  }

  // ---------- render ----------
  _grass() {
    const ctx = this.ctx, p = this.o.pad;
    const g = ctx.createLinearGradient(0, p, 0, this.ch - p);
    g.addColorStop(0, this.o.grass[0]); g.addColorStop(1, this.o.grass[1]);
    ctx.fillStyle = g; this._rr(p, p, this.cw - 2 * p, this.ch - 2 * p, 16); ctx.fill();
    ctx.save(); this._rr(p, p, this.cw - 2 * p, this.ch - 2 * p, 16); ctx.clip();
    const n = 12;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(this.sx(i / n * L), p, this.sl(L / n), this.ch - 2 * p);
    }
    // vignette
    const v = ctx.createRadialGradient(this.cw / 2, this.ch / 2, this.ch * 0.2, this.cw / 2, this.ch / 2, this.cw * 0.7);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, this.cw, this.ch);
    ctx.restore();
  }
  _lines() {
    const ctx = this.ctx; ctx.strokeStyle = this.o.line; ctx.lineWidth = 1.6;
    this._rr(this.sx(0), this.sy(0), this.sl(L), this.sy(W) - this.sy(0), 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(this.sx(L / 2), this.sy(0)); ctx.lineTo(this.sx(L / 2), this.sy(W)); ctx.stroke();
    const cr = this.sl(9.15);
    ctx.beginPath(); ctx.arc(this.sx(L / 2), this.sy(W / 2), cr, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.sx(L / 2), this.sy(W / 2), 2.5, 0, 7); ctx.fillStyle = this.o.line; ctx.fill();
    this._goalEnd(0); this._goalEnd(L);
  }
  _goalEnd(endX) {
    const ctx = this.ctx, left = endX === 0;
    const penD = 16.5, sixD = 5.5;
    const penY0 = 34 - 20.15, penY1 = 34 + 20.15, sixY0 = 34 - 9.16, sixY1 = 34 + 9.16;
    const xPen = left ? penD : L - penD, xSix = left ? sixD : L - sixD;
    ctx.beginPath();
    ctx.moveTo(this.sx(endX), this.sy(penY0)); ctx.lineTo(this.sx(xPen), this.sy(penY0));
    ctx.lineTo(this.sx(xPen), this.sy(penY1)); ctx.lineTo(this.sx(endX), this.sy(penY1)); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.sx(endX), this.sy(sixY0)); ctx.lineTo(this.sx(xSix), this.sy(sixY0));
    ctx.lineTo(this.sx(xSix), this.sy(sixY1)); ctx.lineTo(this.sx(endX), this.sy(sixY1)); ctx.stroke();
    const spot = left ? 11 : L - 11;
    ctx.beginPath(); ctx.arc(this.sx(spot), this.sy(34), 2, 0, 7); ctx.fill();
    // penalty arc (D)
    ctx.beginPath();
    const a0 = left ? -0.9 : Math.PI - 0.9, a1 = left ? 0.9 : Math.PI + 0.9;
    ctx.arc(this.sx(spot), this.sy(34), this.sl(9.15), a0, a1); ctx.stroke();
    // goal
    ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(this.sx(endX), this.sy(34 - 3.66)); ctx.lineTo(this.sx(endX), this.sy(34 + 3.66)); ctx.stroke();
    ctx.lineWidth = 1.6;
  }
  _heat() {
    const ctx = this.ctx; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const draw = (team, col) => {
      const g = this.grid[team]; let mx = 1;
      for (const row of g) for (const v of row) if (v > mx) mx = v;
      const rad = this.sl(L) / this.GY * 1.7;
      for (let i = 0; i < this.GX; i++) for (let j = 0; j < this.GY; j++) {
        const v = g[i][j] / mx; if (v < 0.08) continue;
        const cx = this.sx((j + 0.5) / this.GY * L), cy = this.sy((i + 0.5) / this.GX * W);
        const a = Math.pow(v, 1.25) * 0.42;
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        rg.addColorStop(0, this._rgba(col, a)); rg.addColorStop(1, this._rgba(col, 0));
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill();
      }
    };
    if (this.o.heat === 'home' || this.o.heat === 'both') draw('home', this.o.heatHome);
    if (this.o.heat === 'away' || this.o.heat === 'both') draw('away', this.o.heatAway);
    ctx.restore();
  }
  _net() {
    const ctx = this.ctx;
    for (const e of this.network) {
      ctx.strokeStyle = this._rgba(e.team === 'home' ? this.o.home : this.o.away, 0.28);
      ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(this.sx(e.a.x), this.sy(e.a.y)); ctx.lineTo(this.sx(e.b.x), this.sy(e.b.y)); ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  _drawPlayers() {
    const ctx = this.ctx;
    for (const team of ['home', 'away']) {
      const col = team === 'home' ? this.o.home : this.o.away;
      const dark = team === 'home' ? '#11365f' : '#7a5a16';
      for (let i = 0; i < this.players[team].length; i++) {
        const pl = this.players[team][i];
        const cx = this.sx(pl.pos.x), cy = this.sy(pl.pos.y);
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(cx, cy + 7, 7, 3, 0, 0, 7); ctx.fill();
        const hasBall = team === this.atk && i === this.carrier && this.phase !== 'flight';
        if (hasBall) { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, 7); ctx.stroke(); }
        const g = ctx.createRadialGradient(cx - 2, cy - 3, 1, cx, cy, 8);
        g.addColorStop(0, col); g.addColorStop(1, dark);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.fillStyle = team === 'home' ? '#fff' : '#3a2a06';
        ctx.font = '600 9px IBM Plex Mono, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(pl.num, cx, cy + 0.5);
      }
    }
  }
  _drawBall() {
    const ctx = this.ctx;
    for (let k = 1; k < this.trail.length; k++) {
      const a = k / this.trail.length;
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.5})`; ctx.lineWidth = a * 3.2;
      ctx.beginPath(); ctx.moveTo(this.sx(this.trail[k - 1].x), this.sy(this.trail[k - 1].y));
      ctx.lineTo(this.sx(this.trail[k].x), this.sy(this.trail[k].y)); ctx.stroke();
    }
    const lift = (this.ballLift || 0) * Math.min(34, this.sl(20));
    const bx = this.sx(this.ball.vis.x), by = this.sy(this.ball.vis.y) - lift;
    ctx.shadowColor = 'rgba(255,255,255,0.7)'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, 4.5, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
  }
  _drawFlashes() {
    const ctx = this.ctx;
    for (const f of this.flashes) {
      const cx = this.sx(f.x), cy = this.sy(f.y);
      const life = f.kind === 'pass' ? 0.9 : 1.1;
      const p = 1 - f.ttl / life;
      if (f.kind === 'pass') {
        ctx.strokeStyle = `rgba(255,255,255,${(1 - p) * 0.8})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, 8 + p * 16, 0, 7); ctx.stroke();
      } else {
        const c = f.kind === 'shot' ? '94,156,230' : '226,120,80';
        ctx.fillStyle = `rgba(${c},${(1 - p)})`;
        ctx.font = '700 13px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText(f.kind === 'shot' ? 'SHOT' : 'TURNOVER', cx, cy - 16 - p * 10);
        ctx.strokeStyle = `rgba(${c},${(1 - p) * 0.7})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, 6 + p * 22, 0, 7); ctx.stroke();
      }
    }
  }

  _loop(now) {
    const dt = Math.min(0.04, (now - this.last) / 1000); this.last = now;
    this._update(dt);
    const ctx = this.ctx; ctx.clearRect(0, 0, this.cw, this.ch);
    this._grass(); this._heat(); this._lines(); this._net();
    this._drawPlayers(); this._drawBall(); this._drawFlashes();
    requestAnimationFrame(this._loop);
  }

  _rr(x, y, w, h, r) { const c = this.ctx; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  _rgba(hex, a) { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
}
window.MatchAnim = MatchAnim;
