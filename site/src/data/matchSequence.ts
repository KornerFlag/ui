// Korner Flag — scroll match-sequence data.
// Single source of truth for the 5 scroll states (stats + events) AND the
// pitch geometry (players, ball keyframes, pass lines, heatmap) that the
// GSAP timeline animates. Pitch coordinate space is the SVG viewBox below:
// 200 x 120 units, home attacking left -> right, goal at the right edge.

export const PITCH_VB = { w: 200, h: 120 };

export type Tab = "Passing" | "Tracking" | "Heat" | "Clips";

export interface MatchState {
  phase: string;
  activeTab: Tab;
  time: string;
  possession: string;   // e.g. "54%"
  passes: number;
  distance: string;     // e.g. "66.8 km"
  finalThirdEntries: number;
  reviewClips: number;
  lastPass: string | null;
  event: string;
}

// The five scroll states. Stat values here are the discrete targets the
// counters tween toward between states.
export const matchSequence: MatchState[] = [
  {
    phase: "Build-up",
    activeTab: "Tracking",
    time: "12:08",
    possession: "54%",
    passes: 404,
    distance: "66.8 km",
    finalThirdEntries: 0,
    reviewClips: 0,
    lastPass: null,
    event: "Center back receives",
  },
  {
    phase: "First pass",
    activeTab: "Passing",
    time: "12:16",
    possession: "56%",
    passes: 405,
    distance: "66.9 km",
    finalThirdEntries: 0,
    reviewClips: 0,
    lastPass: "#4 → #6",
    event: "Build-up pass",
  },
  {
    phase: "Progression",
    activeTab: "Passing",
    time: "12:24",
    possession: "58%",
    passes: 408,
    distance: "67.1 km",
    finalThirdEntries: 0,
    reviewClips: 0,
    lastPass: "#6 → #8",
    event: "Line-breaking pass",
  },
  {
    phase: "Final third",
    activeTab: "Passing",
    time: "12:31",
    possession: "60%",
    passes: 410,
    distance: "67.3 km",
    finalThirdEntries: 1,
    reviewClips: 0,
    lastPass: "#8 → #11",
    event: "Final-third entry",
  },
  {
    phase: "Goal",
    activeTab: "Heat",
    time: "12:38",
    possession: "61%",
    passes: 411,
    distance: "67.4 km",
    finalThirdEntries: 1,
    reviewClips: 1,
    lastPass: "#11 → Shot",
    event: "Goal added to review clips",
  },
];

// ---- numeric counter targets, parsed once for the GSAP proxy tweens ----
export interface Counters {
  possession: number;  // percent
  passes: number;
  distance: number;    // km
  finalThirdEntries: number;
  reviewClips: number;
}
export const counterTargets: Counters[] = matchSequence.map((s) => ({
  possession: parseFloat(s.possession),
  passes: s.passes,
  distance: parseFloat(s.distance),
  finalThirdEntries: s.finalThirdEntries,
  reviewClips: s.reviewClips,
}));

// ---- pitch geometry ----

export type Side = "home" | "away";
export interface Player {
  num: number;
  side: Side;
  x: number;
  y: number;
  key?: boolean; // involved in the sequence -> gets emphasis
}

// Home (NC State) attacking left -> right; away (Washington) defending.
export const PLAYERS: Player[] = [
  { num: 1, side: "home", x: 14, y: 60 },
  { num: 4, side: "home", x: 38, y: 58, key: true },
  { num: 5, side: "home", x: 40, y: 38 },
  { num: 2, side: "home", x: 48, y: 92 },
  { num: 3, side: "home", x: 46, y: 24 },
  { num: 6, side: "home", x: 72, y: 48, key: true },
  { num: 8, side: "home", x: 104, y: 66, key: true },
  { num: 10, side: "home", x: 100, y: 88 },
  { num: 7, side: "home", x: 150, y: 92 },
  { num: 11, side: "home", x: 150, y: 28, key: true },
  { num: 9, side: "home", x: 174, y: 58 },
  // away — defensive block on the right
  { num: 5, side: "away", x: 120, y: 44 },
  { num: 6, side: "away", x: 126, y: 70 },
  { num: 4, side: "away", x: 150, y: 56 },
  { num: 2, side: "away", x: 168, y: 34 },
  { num: 3, side: "away", x: 168, y: 84 },
  { num: 8, side: "away", x: 138, y: 96 },
  { num: 1, side: "away", x: 190, y: 60 },
];

// Ball position at each of the 5 states (pitch coords).
export const ballKeyframes: Array<{ x: number; y: number }> = [
  { x: 38, y: 58 }, // at #4
  { x: 72, y: 48 }, // at #6
  { x: 104, y: 66 }, // at #8
  { x: 150, y: 28 }, // at #11
  { x: 192, y: 58 }, // shot -> goal
];

// Pass lines, revealed at the given state index (draw-on via strokeDashoffset).
export interface PassLine {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  revealAt: number; // state index
  shot?: boolean;
}
export const passLines: PassLine[] = [
  { id: "p1", from: { x: 38, y: 58 }, to: { x: 72, y: 48 }, revealAt: 1 },
  { id: "p2", from: { x: 72, y: 48 }, to: { x: 104, y: 66 }, revealAt: 2 },
  { id: "p3", from: { x: 104, y: 66 }, to: { x: 150, y: 28 }, revealAt: 3 },
  { id: "p4", from: { x: 150, y: 28 }, to: { x: 192, y: 58 }, revealAt: 4, shot: true },
];

// Restrained green heatmap blobs, weighted to the attacking third.
export const heatBlobs: Array<{ x: number; y: number; r: number; o: number }> = [
  { x: 150, y: 30, r: 30, o: 0.55 },
  { x: 168, y: 56, r: 34, o: 0.5 },
  { x: 130, y: 64, r: 26, o: 0.4 },
  { x: 178, y: 78, r: 24, o: 0.36 },
  { x: 110, y: 50, r: 22, o: 0.3 },
  { x: 188, y: 44, r: 20, o: 0.3 },
];

export const TABS: Tab[] = ["Passing", "Tracking", "Heat", "Clips"];
