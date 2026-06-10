/* Korner Flags UI kit — mock/static demo data (demo-safe values). */
window.KF_DATA = {
  matches: [
    {
      id: "ncsu-wash", title: "NC State vs Washington", label: "Final Review",
      date: "Mar 14, 2026", duration: "92:14", status: "Ready",
      possession: [54, 46], passes: 412, distance: "67.4 km", moments: 8,
      heat: true, blobs: "left",
    },
    {
      id: "training-poss", title: "Training Session", label: "Possession Pattern Review",
      date: "Mar 10, 2026", duration: "48:30", status: "Ready",
      possession: [61, 39], passes: 286, distance: "41.2 km", moments: 5,
      heat: true, blobs: "central",
    },
    {
      id: "ncsu-heat", title: "NC State Sample", label: "Heatmap Demo",
      date: "Mar 6, 2026", duration: "90:00", status: "Ready",
      possession: [49, 51], passes: 388, distance: "64.9 km", moments: 6,
      heat: true, blobs: "wide",
    },
    {
      id: "ncsu-duke", title: "NC State vs Duke", label: "Conference Match",
      date: "Mar 2, 2026", duration: "91:40", status: "Processing",
      possession: [52, 48], passes: 401, distance: "66.1 km", moments: 0,
      heat: false, blobs: "central",
    },
    {
      id: "scrimmage", title: "Spring Scrimmage", label: "Shape & Buildup",
      date: "Feb 27, 2026", duration: "60:00", status: "Draft",
      possession: [57, 43], passes: 310, distance: "44.8 km", moments: 3,
      heat: false, blobs: "left",
    },
    {
      id: "ncsu-unc", title: "NC State vs UNC", label: "Rivalry Review",
      date: "Feb 21, 2026", duration: "93:05", status: "Ready",
      possession: [47, 53], passes: 369, distance: "68.2 km", moments: 7,
      heat: true, blobs: "wide",
    },
  ],
  players: [
    { id: 7, dist: "8.4 km", load: "High", note: "Movement load high", pct: 100 },
    { id: 12, dist: "7.9 km", load: "High", note: "Central activity", pct: 94 },
    { id: 4, dist: "6.8 km", load: "Med", note: "Wide channel activity", pct: 81 },
    { id: 9, dist: "6.5 km", load: "Med", note: "Final-third runs", pct: 77 },
    { id: 21, dist: "6.1 km", load: "Med", note: "Link play, half-spaces", pct: 73 },
    { id: 3, dist: "5.7 km", load: "Low", note: "Deep build-up", pct: 68 },
    { id: 16, dist: "5.2 km", load: "Low", note: "Wide defensive cover", pct: 62 },
  ],
  passLeaders: [
    { id: 12, passes: 78, pct: 100 },
    { id: 7, passes: 64, pct: 82 },
    { id: 3, passes: 59, pct: 76 },
    { id: 21, passes: 47, pct: 60 },
    { id: 4, passes: 41, pct: 53 },
  ],
  combos: [
    { a: 12, b: 7, count: 23 },
    { a: 3, b: 12, count: 19 },
    { a: 7, b: 9, count: 16 },
    { a: 21, b: 4, count: 14 },
  ],
  moments: [
    { t: "08:42", pct: 9, label: "Wide overload, left" },
    { t: "23:15", pct: 25, label: "Turnover in build-up" },
    { t: "41:08", pct: 45, label: "Switch of play" },
    { t: "57:30", pct: 62, label: "Final-third entry" },
    { t: "68:55", pct: 75, label: "Pressing trap" },
    { t: "81:20", pct: 88, label: "Set-piece routine" },
  ],
  heatBlobs: {
    left: [
      { x: 22, y: 35, r: 120, c: "#B24A36" }, { x: 30, y: 55, r: 150, c: "#D98A3D", o: .8 },
      { x: 18, y: 70, r: 110, c: "#E8C76B", o: .7 }, { x: 45, y: 48, r: 130, c: "#4F86C6", o: .7 },
      { x: 62, y: 40, r: 100, c: "#8FB8DD", o: .6 },
    ],
    central: [
      { x: 50, y: 50, r: 170, c: "#B24A36" }, { x: 42, y: 40, r: 120, c: "#D98A3D", o: .8 },
      { x: 58, y: 60, r: 120, c: "#E8C76B", o: .7 }, { x: 35, y: 62, r: 100, c: "#4F86C6", o: .6 },
      { x: 70, y: 45, r: 110, c: "#8FB8DD", o: .6 },
    ],
    wide: [
      { x: 78, y: 30, r: 130, c: "#B24A36" }, { x: 70, y: 65, r: 140, c: "#D98A3D", o: .8 },
      { x: 85, y: 50, r: 110, c: "#E8C76B", o: .7 }, { x: 50, y: 48, r: 110, c: "#4F86C6", o: .6 },
      { x: 30, y: 55, r: 100, c: "#8FB8DD", o: .55 },
    ],
  },
  packages: [
    {
      id: "single", name: "Single Match Review", price: 149, unit: "per match",
      best: "Best for trying Korner Flags",
      features: ["One full match analysis", "Video review room", "Possession, passing & movement", "Team heatmaps", "Shareable with staff"],
    },
    {
      id: "pilot", name: "Pilot Program", price: 690, unit: "per month", featured: true,
      best: "Best for schools & clubs evaluating",
      features: ["Up to 6 match analyses / month", "Coach feedback loop", "Priority analysis review", "Team heatmaps & passing networks", "Early access to roadmap analytics"],
    },
    {
      id: "club", name: "Team / Club Package", price: null, unit: "Custom",
      best: "Best for clubs & larger programs",
      features: ["Ongoing match analysis", "Multi-team history", "Full staff access", "Recruitment review tools", "Dedicated onboarding"],
    },
  ],
  roadmap: [
    { icon: "git-branch", title: "Pass networks", desc: "Player-to-player link maps showing how phases connected.", tag: "Coming soon" },
    { icon: "crosshair", title: "Shot maps", desc: "Shot locations, outcomes and expected-goal context.", tag: "Planned" },
    { icon: "route", title: "Assist chains", desc: "The build-up sequences that led to chances.", tag: "Planned" },
    { icon: "flame", title: "Per-player heatmaps", desc: "Individual positioning maps across a match.", tag: "Coming soon" },
    { icon: "gauge", title: "Calibration-backed speed", desc: "Sprint speed once calibration is validated.", tag: "Premium roadmap" },
    { icon: "target", title: "Tracking stability", desc: "Improved player identity across crowded phases.", tag: "Premium roadmap" },
  ],
};
