/**
 * heroTrackingSequence — single source of truth for the scroll-controlled
 * VideoTrackingHero. Each entry is one scroll "beat"; the GSAP timeline in
 * VideoTrackingHero.astro crossfades between the frames and tweens the overlay
 * from one state to the next.
 *
 * ── Tuning the analytics overlay ───────────────────────────────────────────
 * All coordinates are PERCENTAGES of the frame box (origin top-left):
 *   x = 0 (left edge) … 100 (right edge)
 *   y = 0 (top edge)  … 100 (bottom edge)
 *
 * To move the tracking circle for a state, edit its `marker`.
 * To re-aim the progressive pass, edit state 3's `passLine.from` / `.to`.
 * The receiver highlight ring (state 4) sits on that state's `marker`.
 * No component or timeline edits are ever needed to reposition — only this file.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface HeroState {
  /** stable id (used for keys / debugging) */
  id: string;
  /** base-relative image path, resolved through withBase() in the component */
  image: string;
  /** short alt text for the frame */
  alt: string;
  /** overlay label text, e.g. "#8 · 12.4 mph" */
  label: string;
  /** possession %, interpolated between states */
  possession: number;
  /** event-pill text */
  event: string;
  /** tracking-circle centre — EDIT to reposition the circle */
  marker: Vec2;
  /** progressive pass line (state 3 only) */
  passLine?: { from: Vec2; to: Vec2 };
  /** ring the marker as the receiving player (state 4) */
  highlightReceiver?: boolean;
  /** fade in the green heatmap wash (state 6 / goal) */
  showHeatmap?: boolean;
  /** review-clips counter value (state 6 / goal) */
  reviewClips?: number;
}

export const heroTrackingSequence: HeroState[] = [
  {
    id: "receive",
    image: "images/sequence/img1.webp",
    alt: "Midfielder #8 receives the ball at the halfway line",
    label: "#8 · 12.4 mph",
    possession: 54,
    event: "Tracking active",
    marker: { x: 62, y: 58 },
  },
  {
    id: "carry",
    image: "images/sequence/img2.webp",
    alt: "Midfielder #8 carries the ball forward",
    label: "#8 · 14.1 mph",
    possession: 57,
    event: "Carry forward",
    marker: { x: 63, y: 56 },
  },
  {
    id: "pass",
    image: "images/sequence/img3.webp",
    alt: "Midfielder #8 plays a progressive pass",
    label: "Progressive pass",
    possession: 59,
    event: "Progressive pass",
    marker: { x: 48, y: 56 },
    passLine: { from: { x: 48, y: 56 }, to: { x: 82, y: 50 } },
  },
  {
    id: "receive-box",
    image: "images/sequence/img4.webp",
    alt: "Winger #11 receives near the box for a final-third entry",
    label: "#11 · Final-third entry",
    possession: 61,
    event: "Final-third entry",
    marker: { x: 47, y: 56 },
    highlightReceiver: true,
  },
  {
    id: "shot",
    image: "images/sequence/img5.webp",
    alt: "Winger #11 shapes to shoot on goal",
    label: "#11 · Shot on goal",
    possession: 62,
    event: "Shot on goal",
    marker: { x: 60, y: 56 },
  },
  {
    id: "goal",
    image: "images/sequence/img6.webp",
    alt: "The ball hits the net for a goal",
    label: "Goal",
    possession: 62,
    event: "Goal added to review clips",
    marker: { x: 91, y: 52 },
    showHeatmap: true,
    reviewClips: 1,
  },
];

export default heroTrackingSequence;
