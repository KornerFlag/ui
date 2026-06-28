import { PITCH_VB, PLAYERS, passLines, heatBlobs } from "@/data/matchSequence";

const L = "rgba(255,255,255,0.13)";   // pitch lines
const LSOFT = "rgba(255,255,255,0.07)";

function len(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// The tactical pitch. Purely presentational — every animatable element carries
// a stable id/class so the GSAP timeline (in ScrollMatchSequence) can target it
// within its scoped context. No animation logic lives here.
export default function TacticalPitch() {
  const { w, h } = PITCH_VB;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full"
      role="img"
      aria-label="Tactical pitch showing a possession sequence"
    >
      <defs>
        <linearGradient id="kf-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#173524" />
          <stop offset="100%" stopColor="#0F2619" />
        </linearGradient>
        <pattern id="kf-mow" width={w / 8} height={h} patternUnits="userSpaceOnUse">
          <rect width={w / 16} height={h} fill="rgba(255,255,255,0.018)" />
        </pattern>
        <radialGradient id="kf-heatfill">
          <stop offset="0%" stopColor="#37C281" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#2C9E6C" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2C9E6C" stopOpacity="0" />
        </radialGradient>
        <filter id="kf-heatblur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <filter id="kf-ballshadow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.7" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* turf */}
      <rect x="0" y="0" width={w} height={h} rx="3" fill="url(#kf-grass)" />
      <rect x="0" y="0" width={w} height={h} fill="url(#kf-mow)" />

      {/* markings */}
      <g stroke={L} strokeWidth="0.5" fill="none">
        <rect x="6" y="8" width={w - 12} height={h - 16} rx="1.5" />
        <line x1={w / 2} y1="8" x2={w / 2} y2={h - 8} />
        <circle cx={w / 2} cy={h / 2} r="15" />
        <circle cx={w / 2} cy={h / 2} r="0.8" fill={L} stroke="none" />
        {/* left box */}
        <rect x="6" y={h / 2 - 24} width="22" height="48" />
        <rect x="6" y={h / 2 - 11} width="9" height="22" />
        {/* right box */}
        <rect x={w - 28} y={h / 2 - 24} width="22" height="48" />
        <rect x={w - 15} y={h / 2 - 11} width="9" height="22" />
        {/* goals */}
        <rect x="2.5" y={h / 2 - 6} width="3.5" height="12" stroke={LSOFT} />
        <rect x={w - 6} y={h / 2 - 6} width="3.5" height="12" stroke={LSOFT} />
      </g>

      {/* heatmap overlay — hidden until the final state */}
      <g id="kf-heat" opacity="0" filter="url(#kf-heatblur)" style={{ mixBlendMode: "screen", transition: "opacity 0.55s ease" }}>
        {heatBlobs.map((b, i) => (
          <circle key={i} className="kf-heatblob" cx={b.x} cy={b.y} r={b.r} fill="url(#kf-heatfill)" opacity={b.o} />
        ))}
      </g>

      {/* pass / shot / save lines — drawn on via strokeDashoffset (butt caps so
          a hidden line shows no leftover round-cap dot at its origin) */}
      <g fill="none" strokeLinecap="butt">
        {passLines.map((p) => {
          const d = len(p.from, p.to);
          const stroke = p.kind === "shot" ? "#E8C76B" : p.kind === "save" ? "#B6C1CE" : "#6FA8E8";
          const width = p.kind === "shot" ? 1.5 : p.kind === "save" ? 1 : 1.2;
          return (
            <path
              key={p.id}
              className="kf-pass"
              data-pass={p.id}
              d={`M ${p.from.x} ${p.from.y} L ${p.to.x} ${p.to.y}`}
              stroke={stroke}
              strokeWidth={width}
              strokeDasharray={d}
              strokeDashoffset={d}
              opacity={p.kind === "save" ? 0.7 : p.kind === "shot" ? 0.95 : 0.85}
            />
          );
        })}
      </g>

      {/* players */}
      <g>
        {PLAYERS.map((p, i) => {
          const home = p.side === "home";
          const fill = home ? (p.key ? "#4F92EC" : "#3F86E0") : "#5C6B7A";
          return (
            // outer <g> = scripted runs (transform); inner .kf-drift = continuous idle drift
            <g key={`${p.side}-${p.num}-${i}`} className="kf-player" data-num={p.num} data-side={p.side}>
              <g className="kf-drift">
                {p.key && home && (
                  <circle cx={p.x} cy={p.y} r="4.6" fill="none" stroke="#6FA8E8" strokeWidth="0.5" opacity="0.5" />
                )}
                <circle cx={p.x} cy={p.y} r="3.4" fill={fill} stroke="rgba(255,255,255,0.85)" strokeWidth="0.4" />
                <text
                  x={p.x} y={p.y + 1.1} textAnchor="middle" fontSize="3.1" fontWeight={600}
                  fill={home ? "#fff" : "#cdd5dd"} fontFamily="'Space Grotesk', sans-serif"
                  style={{ pointerEvents: "none" }}
                >
                  {p.num}
                </text>
              </g>
            </g>
          );
        })}
      </g>

      {/* soccer ball — drawn centered at (0,0); positioned + spun by GSAP */}
      <g id="kf-ball" transform="translate(38 58)" filter="url(#kf-ballshadow)">
        <circle r="2.4" fill="#fff" stroke="#0B141C" strokeWidth="0.22" />
        {/* center pentagon */}
        <path d="M0,-1 L0.95,-0.31 L0.59,0.81 L-0.59,0.81 L-0.95,-0.31 Z" fill="#0B141C" />
        {/* seams from pentagon vertices to the rim */}
        <g stroke="#0B141C" strokeWidth="0.24" strokeLinecap="round">
          <line x1="0" y1="-1" x2="0" y2="-2.4" />
          <line x1="0.95" y1="-0.31" x2="2.28" y2="-0.74" />
          <line x1="0.59" y1="0.81" x2="1.42" y2="1.94" />
          <line x1="-0.59" y1="0.81" x2="-1.42" y2="1.94" />
          <line x1="-0.95" y1="-0.31" x2="-2.28" y2="-0.74" />
        </g>
        {/* rim patches */}
        <g fill="#0B141C">
          <path d="M0,-2.4 a2.4,2.4 0 0 1 0.95,0.17 l-0.95,0.23 z" opacity="0.85" />
          <path d="M1.42,1.94 a2.4,2.4 0 0 1-1.0,0.4 l0.18,-0.95 z" opacity="0.85" />
        </g>
      </g>
    </svg>
  );
}
