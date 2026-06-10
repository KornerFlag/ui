/* KFPitch — throwaway native pitch renderer for the landing hero sketches.
   Renders a styled soccer field + density heatmap + animated player dots from
   the real positions.json tracking data. Coordinate space matches the pipeline:
   x = width  (0..PITCH_W, 23.32m)   y = length (0..PITCH_L, 68m)
   We render LANDSCAPE: length runs left->right, width runs top->bottom. */

class KFPitch {
  constructor(canvas, data, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = data;
    this.W = window.KF_DATA.PITCH_W;
    this.L = window.KF_DATA.PITCH_L;
    this.o = Object.assign({
      team1: '#6BA0D8',          // steel
      team2: '#E8C76B',          // amber
      line: 'rgba(233,242,252,0.5)',
      grass: ['#0e3b2e', '#0a2c24'],
      heat: null,                // null | 'team1' | 'team2' | 'both'
      heatColor1: '#4F86C6',
      heatColor2: '#E8C76B',
      dots: true,
      trails: true,
      scan: false,
      speed: 1,                  // seconds per second
      pad: 26,
    }, opts);
    this.t = 0;
    this.last = performance.now();
    this.trailMap = new Map();   // id -> [{x,y}]
    this._resize = this._resize.bind(this);
    this._loop = this._loop.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();
    requestAnimationFrame(this._loop);
  }

  _resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = r.width;
    this.ch = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // map pitch (x=width, y=length) -> screen px
  sx(y) { const p = this.o.pad; return p + (y / this.L) * (this.cw - 2 * p); }
  sy(x) { const p = this.o.pad; return p + (x / this.W) * (this.ch - 2 * p); }

  _grass() {
    const ctx = this.ctx, p = this.o.pad;
    const g = ctx.createLinearGradient(0, 0, 0, this.ch);
    g.addColorStop(0, this.o.grass[0]);
    g.addColorStop(1, this.o.grass[1]);
    ctx.fillStyle = g;
    this._roundRect(p, p, this.cw - 2 * p, this.ch - 2 * p, 14);
    ctx.fill();
    // mowing stripes along length
    ctx.save();
    this._roundRect(p, p, this.cw - 2 * p, this.ch - 2 * p, 14);
    ctx.clip();
    const stripes = 10;
    for (let i = 0; i < stripes; i++) {
      if (i % 2) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      const x0 = this.sx((i / stripes) * this.L);
      const x1 = this.sx(((i + 1) / stripes) * this.L);
      ctx.fillRect(x0, p, x1 - x0, this.ch - 2 * p);
    }
    ctx.restore();
  }

  _lines() {
    const ctx = this.ctx;
    ctx.strokeStyle = this.o.line;
    ctx.lineWidth = 1.5;
    // outer
    this._roundRect(this.sx(0), this.sy(0), this.sx(this.L) - this.sx(0), this.sy(this.W) - this.sy(0), 12);
    ctx.stroke();
    // halfway line
    ctx.beginPath();
    ctx.moveTo(this.sx(this.L / 2), this.sy(0));
    ctx.lineTo(this.sx(this.L / 2), this.sy(this.W));
    ctx.stroke();
    // center circle
    ctx.beginPath();
    const r = (9.15 / this.W) * (this.ch - 2 * this.o.pad);
    ctx.arc(this.sx(this.L / 2), this.sy(this.W / 2), Math.min(r, this.ch * 0.18), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = this.o.line;
    ctx.beginPath();
    ctx.arc(this.sx(this.L / 2), this.sy(this.W / 2), 2, 0, Math.PI * 2);
    ctx.fill();
    // penalty + goal box on the right (attacking end)
    this._box(this.L, 16.5, 40.3 / this.W);
    this._box(this.L, 5.5, 18.3 / this.W);
    this._box(0, 16.5, 40.3 / this.W, true);
    this._box(0, 5.5, 18.3 / this.W, true);
  }

  _box(endY, depthM, widthFrac, leftEnd = false) {
    const ctx = this.ctx;
    const w = Math.min(widthFrac, 0.85) * this.W;
    const x0 = (this.W - w) / 2, x1 = (this.W + w) / 2;
    const yA = leftEnd ? 0 : this.L - depthM;
    const yB = leftEnd ? depthM : this.L;
    ctx.beginPath();
    ctx.moveTo(this.sx(leftEnd ? yB : yA), this.sy(x0));
    ctx.lineTo(this.sx(leftEnd ? yB : yA), this.sy(x1));
    ctx.moveTo(this.sx(yA), this.sy(x0));
    ctx.lineTo(this.sx(yB), this.sy(x0));
    ctx.moveTo(this.sx(yA), this.sy(x1));
    ctx.lineTo(this.sx(yB), this.sy(x1));
    ctx.stroke();
  }

  _heat(grid, color) {
    const ctx = this.ctx;
    const GX = this.data.GX, GY = this.data.GY;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cellW = (this.sx(this.L) - this.sx(0)) / GY;
    const cellH = (this.sy(this.W) - this.sy(0)) / GX;
    const rad = Math.max(cellW, cellH) * 1.5;
    for (let i = 0; i < GX; i++) {
      for (let j = 0; j < GY; j++) {
        const v = grid[i][j];
        if (v < 0.06) continue;
        const cx = this.sx(((j + 0.5) / GY) * this.L);
        const cy = this.sy(((i + 0.5) / GX) * this.W);
        const a = Math.pow(v, 1.3) * 0.5;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, this._rgba(color, a));
        g.addColorStop(1, this._rgba(color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _playersAt(t) {
    const frames = this.data.frames;
    const n = frames.length;
    const i0 = Math.max(0, Math.min(n - 1, Math.floor(t)));
    const i1 = Math.min(n - 1, i0 + 1);
    const f = t - i0;
    const a = new Map(frames[i0].p.map(p => [p[0], p]));
    const b = new Map(frames[i1].p.map(p => [p[0], p]));
    const out = [];
    for (const [id, pa] of a) {
      const pb = b.get(id) || pa;
      out.push({ id, x: pa[1] + (pb[1] - pa[1]) * f, y: pa[2] + (pb[2] - pa[2]) * f, team: pa[3] });
    }
    return out;
  }

  _dots(players) {
    const ctx = this.ctx;
    for (const pl of players) {
      const cx = this.sx(pl.y), cy = this.sy(pl.x);
      const col = pl.team === 2 ? this.o.team2 : this.o.team1;
      if (this.o.trails) {
        let tr = this.trailMap.get(pl.id);
        if (!tr) { tr = []; this.trailMap.set(pl.id, tr); }
        tr.push({ cx, cy });
        if (tr.length > 14) tr.shift();
        ctx.beginPath();
        for (let k = 0; k < tr.length; k++) {
          const pt = tr[k];
          if (k === 0) ctx.moveTo(pt.cx, pt.cy); else ctx.lineTo(pt.cx, pt.cy);
        }
        ctx.strokeStyle = this._rgba(col, 0.18);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
  }

  _scan(players) {
    const ctx = this.ctx;
    const cycle = this.L;
    const sweepY = (this.t * 12) % cycle;          // sweep moves along length
    const sxp = this.sx(sweepY);
    const grad = ctx.createLinearGradient(sxp - 40, 0, sxp + 6, 0);
    grad.addColorStop(0, 'rgba(110,160,216,0)');
    grad.addColorStop(1, 'rgba(150,200,255,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(sxp - 40, this.sy(0), 46, this.sy(this.W) - this.sy(0));
    ctx.strokeStyle = 'rgba(180,215,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sxp, this.sy(0)); ctx.lineTo(sxp, this.sy(this.W)); ctx.stroke();
    // detection rings near the sweep
    for (const pl of players) {
      const cx = this.sx(pl.y);
      if (Math.abs(cx - sxp) < 26) {
        const cy = this.sy(pl.x);
        const r = 9 + (26 - Math.abs(cx - sxp)) * 0.5;
        ctx.strokeStyle = 'rgba(180,215,255,0.7)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
      }
    }
  }

  _loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt * this.o.speed;
    if (this.t >= this.data.frames.length - 1) { this.t = 0; this.trailMap.clear(); }
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);
    this._grass();
    if (this.o.heat === 'team1' || this.o.heat === 'both') this._heat(this.data.grid1, this.o.heatColor1);
    if (this.o.heat === 'team2' || this.o.heat === 'both') this._heat(this.data.grid2, this.o.heatColor2);
    this._lines();
    const players = this._playersAt(this.t);
    if (this.o.scan) this._scan(players);
    if (this.o.dots) this._dots(players);
    if (this.onTick) this.onTick(this.t, players);
    requestAnimationFrame(this._loop);
  }

  setHeat(mode) { this.o.heat = mode; this.trailMap.clear(); }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  _rgba(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
}

window.KFPitch = KFPitch;
