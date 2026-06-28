export interface Member {
  name: string;
  role: string;
  focus: string;
  initials: string;
}

export const TEAM: Member[] = [
  { name: "Krish Naik Gaunekar", role: "Tracking & pipeline", focus: "Detection & tracking models, stat extraction, and the analysis pipeline.", initials: "KN" },
  { name: "Achyuta Anandakrishnan", role: "Product & growth", focus: "Product, the coach-facing UI, and go-to-market outreach.", initials: "AA" },
  { name: "Osman", role: "AI features & infrastructure", focus: "Formation detection and the GPU, storage and serving stack.", initials: "OS" },
];
