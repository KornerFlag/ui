# Landing Page Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a demo-video, pricing, and team section to the existing Korner Flag landing page and apply a visual-polish/motion pass — without restructuring the hero or scroll-board.

**Architecture:** In-place enhancement of the Astro site under `site/`. New content lives in focused `.astro` components imported by `index.astro`; shared data (pricing plans, team) lives in `site/src/lib/*.ts`. Polish is additive CSS in `site/public/kf/styles.css` plus a scroll-spy tweak in `KfLayout.astro`. No new dependencies.

**Tech Stack:** Astro 6, plain CSS (design tokens in `site/public/kf/styles.css`), existing `VideoPlayer.astro`.

## Global Constraints

- Branch: `feat/landing-improvements` (already created). Never commit to `main`.
- Design language is fixed: Space Grotesk (display) + Inter (body); tokens/classes from `site/public/kf/styles.css` (`--accent #2C6AD4`, `--green #3C9E6C`, `--ink #0E1822`, `--grad`, `.btn*`, `.eyebrow`, `.section`, `.section-head`, `.reveal`, `.feature`, `.cta`, `.hero-pill`, `.room-chip`).
- Base path is `/ui` (`astro.config` `base: '/ui'`). Internal links use `import.meta.env.BASE_URL`. Asset src in `VideoPlayer.astro` is passed WITHOUT base (it calls `withBase` internally).
- No new npm dependencies. No changes to the React dashboard artifact.
- Verification per task: `cd site && npx astro build` must exit 0; then screenshot via headless Chrome against the built site served at `/ui`.
- One commit per task. Commit message style: `feat(landing): …` / `refactor(landing): …`.

### Reusable verification helpers (used by multiple tasks)

**Build check:**
```bash
cd /Users/achyu/Documents/kalshi/korner/site && npx astro build 2>&1 | tail -8
```
Expected: ends with `Complete!` / no error; exit 0.

**Serve + screenshot a section** (replace `ANCHOR` and `NAME`):
```bash
ROOT=/private/tmp/kf-serve; rm -rf "$ROOT"; mkdir -p "$ROOT/ui"
cp -R /Users/achyu/Documents/kalshi/korner/site/dist/* "$ROOT/ui/"
# astro base '/ui' already nests output under dist root; if dist has no /ui, symlink instead:
[ -d "$ROOT/ui/index.html" ] || true
cd "$ROOT" && (python3 -m http.server 8799 >/dev/null 2>&1 &) ; sleep 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,1200 \
  --virtual-time-budget=6000 --default-background-color=FFFFFFFF \
  --screenshot=/private/tmp/kf-NAME.png "http://localhost:8799/ui/#ANCHOR"
pkill -f "http.server 8799"
```
> Note: confirm the dist base layout first with `ls site/dist` — if `dist/` already contains the page at root, serve `dist` so the URL is `http://localhost:8799/ui/`. Use the symlink approach from prior art if needed: `ln -s site/dist "$ROOT/ui"`.

Then Read `/private/tmp/kf-NAME.png` to confirm the section renders.

---

### Task 1: Extract pricing plans to a shared module (dedupe)

**Files:**
- Create: `site/src/lib/plans.ts`
- Modify: `site/src/pages/checkout.astro` (replace inline `plans` array, lines ~7-25)

**Interfaces:**
- Produces: `export interface Plan { name: string; price: string; cadence: string; note: string; href: string; popular?: boolean }` and `export const PLANS: Plan[]`.

- [ ] **Step 1: Create `site/src/lib/plans.ts`**

```ts
export interface Plan {
  name: string;
  price: string;
  cadence: string;
  note: string;
  href: string;      // base-relative path segment, e.g. "checkout/" or "contact/"
  popular?: boolean;
}

// Single source of truth for pricing — consumed by the landing Pricing
// section and the checkout page so the two never drift.
export const PLANS: Plan[] = [
  {
    name: "Single match review",
    price: "$49",
    cadence: "per match",
    note: "For staff who need one presentation-ready analysis room.",
    href: "checkout/",
  },
  {
    name: "Team package",
    price: "$149",
    cadence: "per batch",
    note: "For clubs or staff groups working through several matches at once.",
    href: "checkout/",
    popular: true,
  },
  {
    name: "Custom workflow",
    price: "Talk to us",
    cadence: "enterprise",
    note: "For recurring ingest, custom reporting, or recruiting-heavy review needs.",
    href: "contact/",
  },
];
```

- [ ] **Step 2: Refactor `checkout.astro` to import the shared array**

In `site/src/pages/checkout.astro` frontmatter, delete the inline `const plans = [ … ];` block and add to the imports:

```ts
import { PLANS as plans } from "../lib/plans.ts";
```

Leave the rest of `checkout.astro` (which maps over `plans`) unchanged. The added `href`/`popular` fields are extra; existing checkout markup ignores them.

- [ ] **Step 3: Build check**

Run the **Build check** helper. Expected: exit 0, no error.

- [ ] **Step 4: Verify checkout still renders the 3 plans**

Screenshot helper with `NAME=checkout`, URL `http://localhost:8799/ui/checkout/`. Read the PNG; confirm three plan cards with $49 / $149 / Talk to us.

- [ ] **Step 5: Commit**

```bash
cd /Users/achyu/Documents/kalshi/korner
git add site/src/lib/plans.ts site/src/pages/checkout.astro
git commit -m "refactor(landing): extract pricing plans to shared lib/plans.ts"
```

---

### Task 2: Pricing section component + insert

**Files:**
- Create: `site/src/components/Pricing.astro`
- Modify: `site/src/pages/index.astro` (insert `<Pricing />` after the features section, before the match-room preview)
- Modify: `site/src/layouts/KfLayout.astro` (add Pricing nav link)
- Modify: `site/public/kf/styles.css` (append `.pricing*` rules)

**Interfaces:**
- Consumes: `PLANS` from `site/src/lib/plans.ts`.

- [ ] **Step 1: Create `site/src/components/Pricing.astro`**

```astro
---
import { PLANS } from "../lib/plans.ts";
const base = import.meta.env.BASE_URL;
const arrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
---
<section class="section pricing" id="pricing" style="padding-top:0">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">Pricing</span>
      <h2>Start free. Scale when it's working.</h2>
      <p>Your first match analysis is on us. Pay only once you've seen your own footage turned into a coach-ready room.</p>
    </div>
    <div class="price-free reveal" data-d="1">
      <span class="hero-pill"><span class="tag">Free</span> One-match analysis, on us — no card required</span>
    </div>
    <div class="price-grid">
      {PLANS.map((p, i) => (
        <div class={`price-card reveal${p.popular ? " is-popular" : ""}`} data-d={String(i + 1)}>
          {p.popular && <span class="price-flag">Most popular</span>}
          <div class="price-name">{p.name}</div>
          <div class="price-amt"><span class="price-n">{p.price}</span><span class="price-cad">{p.cadence}</span></div>
          <p class="price-note">{p.note}</p>
          <a class={`btn ${p.popular ? "btn-accent" : "btn-ghost"}`} href={`${base}${p.href}`} set:html={`${p.price === "Talk to us" ? "Talk to us" : "Choose plan"} ${arrow}`}></a>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Append pricing styles to `site/public/kf/styles.css`**

```css
/* ---------- pricing ---------- */
.price-free { display: flex; justify-content: center; margin-top: 28px; }
.price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 28px; }
.price-card { position: relative; display: flex; flex-direction: column; padding: 28px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; box-shadow: var(--sh-sm); transition: transform .3s var(--ease), box-shadow .3s var(--ease), border-color .3s; }
.price-card:hover { transform: translateY(-4px); box-shadow: var(--sh); }
.price-card.is-popular { border-color: transparent; box-shadow: 0 0 0 1.5px rgba(44,106,212,.35), var(--sh); }
.price-flag { position: absolute; top: -11px; left: 28px; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: #fff; background: var(--grad); padding: 5px 11px; border-radius: 999px; }
.price-name { font-family: var(--font-display); font-size: 16px; font-weight: 600; color: var(--text-2); }
.price-amt { display: flex; align-items: baseline; gap: 8px; margin: 12px 0 4px; }
.price-n { font-family: var(--font-display); font-size: 40px; font-weight: 500; letter-spacing: -.02em; }
.price-cad { font-size: 13px; color: var(--text-3); }
.price-note { font-size: 14px; color: var(--text-2); line-height: 1.55; margin: 8px 0 20px; flex: 1; }
.price-card .btn { width: 100%; }
@media (max-width: 820px){ .price-grid{ grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Insert `<Pricing />` into `index.astro`**

In `site/src/pages/index.astro`: add `import Pricing from "../components/Pricing.astro";` at the top frontmatter. Then place `<Pricing />` immediately AFTER the closing `</section>` of the `#features` section and BEFORE the `<!-- MATCH ROOM PREVIEW -->` section.

- [ ] **Step 4: Add Pricing nav link in `KfLayout.astro`**

In the `navLinks` array, insert after the Features entry:
```ts
{ label: "Pricing", href: `${base}#pricing` },
```

- [ ] **Step 5: Build check** — run Build check helper. Expected exit 0.

- [ ] **Step 6: Screenshot** — helper with `NAME=pricing`, `ANCHOR=pricing`. Read PNG; confirm free pill + 3 cards, "Most popular" flag + accent border on the $149 card.

- [ ] **Step 7: Commit**

```bash
git add site/src/components/Pricing.astro site/src/pages/index.astro site/src/layouts/KfLayout.astro site/public/kf/styles.css
git commit -m "feat(landing): add pricing section with shared plans + nav link"
```

---

### Task 3: Demo video section

**Files:**
- Create: `site/src/components/DemoVideo.astro`
- Modify: `site/src/pages/index.astro` (insert `<DemoVideo />` after the scroll-board section, before How it works; repoint hero secondary CTA to `#demo`)
- Modify: `site/public/kf/styles.css` (append `.demo*` rules)

**Interfaces:**
- Consumes: existing `VideoPlayer.astro` (props `src`, `poster`, `title`).

- [ ] **Step 1: Confirm the video asset + size**

```bash
ls -la /Users/achyu/Documents/kalshi/korner/site/public/data/nc_state_stats_preview.mp4
```
Expected: file exists. Note size — if > 8 MB, set `preload="none"` in Step 2 (VideoPlayer already uses `preload="metadata"`; acceptable for preview clips).

- [ ] **Step 2: Create `site/src/components/DemoVideo.astro`**

```astro
---
import VideoPlayer from "./VideoPlayer.astro";
---
<section class="section demo" id="demo" style="padding-top:0">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">See it work</span>
      <h2>Watch a match become a review room.</h2>
      <p>One clip of existing footage, turned into tracking, possession and heatmaps — the same output your staff opens after every game.</p>
    </div>
    <div class="demo-frame reveal" data-d="1">
      <div class="board-glow"></div>
      <VideoPlayer src="data/nc_state_stats_preview.mp4" title="Korner Flag demo — NC State vs Washington" />
      <div class="demo-chips">
        <span class="room-chip">Tracking</span>
        <span class="room-chip">Possession</span>
        <span class="room-chip">Heatmaps</span>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Append demo styles to `site/public/kf/styles.css`**

```css
/* ---------- demo video ---------- */
.demo-frame { position: relative; max-width: 940px; margin: 40px auto 0; border-radius: 22px; }
.demo-frame .video-shell { border-radius: 20px; }
.demo-chips { display: flex; gap: 8px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
```
> `.board-glow` and `.room-chip` already exist in styles.css and are reused here.

- [ ] **Step 4: Insert `<DemoVideo />` + repoint hero CTA in `index.astro`**

Add `import DemoVideo from "../components/DemoVideo.astro";` to frontmatter. Place `<DemoVideo />` immediately AFTER the `</section>` of the `#scrolly` (scroll-board) section and BEFORE `<!-- HOW IT WORKS -->`. Then change the hero secondary CTA href from `${base}room/` to `${base}#demo` and its text from "See the match room" to "Watch the demo".

- [ ] **Step 5: Build check** — exit 0.

- [ ] **Step 6: Screenshot** — `NAME=demo`, `ANCHOR=demo`. Read PNG; confirm framed video with poster + 3 chips + glow border.

- [ ] **Step 7: Commit**

```bash
git add site/src/components/DemoVideo.astro site/src/pages/index.astro site/public/kf/styles.css
git commit -m "feat(landing): add embedded demo video section"
```

---

### Task 4: Team / founders section

**Files:**
- Create: `site/src/lib/team.ts`, `site/src/components/Team.astro`
- Modify: `site/src/pages/index.astro` (insert `<Team />` after the match-room preview, before the CTA)
- Modify: `site/public/kf/styles.css` (append `.team*` rules)

**Interfaces:**
- Produces: `export interface Member { name: string; role: string; focus: string; initials: string }` and `export const TEAM: Member[]`.

- [ ] **Step 1: Create `site/src/lib/team.ts`**

```ts
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
```

- [ ] **Step 2: Create `site/src/components/Team.astro`**

```astro
---
import { TEAM } from "../lib/team.ts";
---
<section class="section team" id="team">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">Who's building it</span>
      <h2>A small team shipping fast.</h2>
      <p>Three builders covering computer vision, product and infrastructure — turning research into a tool coaches actually use.</p>
    </div>
    <div class="team-grid">
      {TEAM.map((m, i) => (
        <div class="team-card reveal" data-d={String(i + 1)}>
          <span class="team-avatar">{m.initials}</span>
          <div class="team-name">{m.name}</div>
          <div class="team-role">{m.role}</div>
          <p class="team-focus">{m.focus}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 3: Append team styles to `site/public/kf/styles.css`**

```css
/* ---------- team ---------- */
.team { background: var(--bg-soft); border-top: 1px solid var(--border-2); border-bottom: 1px solid var(--border-2); }
.team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 48px; }
.team-card { padding: 28px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; box-shadow: var(--sh-sm); transition: transform .3s var(--ease), box-shadow .3s var(--ease); }
.team-card:hover { transform: translateY(-4px); box-shadow: var(--sh); }
.team-avatar { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 14px; font-family: var(--font-display); font-weight: 600; font-size: 18px; color: #fff; background: var(--grad); box-shadow: 0 8px 18px -8px rgba(44,106,212,.5); }
.team-name { font-family: var(--font-display); font-size: 18px; font-weight: 600; margin-top: 16px; }
.team-role { font-size: 13px; font-weight: 600; color: var(--accent); margin-top: 4px; }
.team-focus { font-size: 14px; color: var(--text-2); line-height: 1.55; margin-top: 10px; }
@media (max-width: 820px){ .team-grid{ grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Insert `<Team />` into `index.astro`**

Add `import Team from "../components/Team.astro";`. Place `<Team />` immediately AFTER the `</section>` of the `#room` (match-room preview) section and BEFORE the `<!-- CTA -->` section.

- [ ] **Step 5: Build check** — exit 0.

- [ ] **Step 6: Screenshot** — `NAME=team`, `ANCHOR=team`. Read PNG; confirm 3 member cards with gradient initial avatars.

- [ ] **Step 7: Commit**

```bash
git add site/src/lib/team.ts site/src/components/Team.astro site/src/pages/index.astro site/public/kf/styles.css
git commit -m "feat(landing): add team/founders section"
```

---

### Task 5: Visual polish & motion pass

**Files:**
- Modify: `site/public/kf/styles.css` (append polish rules)
- Modify: `site/src/layouts/KfLayout.astro` (extend nav scroll script for active-anchor scroll-spy)

**Interfaces:** none new.

- [ ] **Step 1: Append polish rules to `site/public/kf/styles.css`**

```css
/* ---------- polish pass ---------- */
/* button arrow micro-nudge */
.btn svg { transition: transform .2s var(--ease); }
.btn:hover svg { transform: translateX(2px); }
/* visible keyboard focus everywhere */
.btn:focus-visible, .nav-links a:focus-visible, .foot-links a:focus-visible,
.board-mode:focus-visible, a.brand:focus-visible {
  outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 8px;
}
/* active in-page nav link */
.nav-links a.active { color: var(--text); background: rgba(16,24,34,.05); }
```

- [ ] **Step 2: Verify reduced-motion already covers new reveals**

Confirm `site/public/kf/styles.css` contains the existing `@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; … } }` block. New sections use `.reveal`, so they are already covered. No change needed; just confirm by grep:
```bash
grep -n "prefers-reduced-motion" /Users/achyu/Documents/kalshi/korner/site/public/kf/styles.css
```
Expected: at least one match.

- [ ] **Step 3: Add scroll-spy to `KfLayout.astro` nav script**

In the inline `<script>` at the bottom of `KfLayout.astro`, after the existing reveal IntersectionObserver, append:

```js
// active in-page nav link (scroll-spy)
const spyIds = ["how", "features", "pricing", "team"];
const spyLinks = new Map();
document.querySelectorAll(".nav-links a").forEach((a) => {
  const h = a.getAttribute("href") || "";
  const id = h.includes("#") ? h.split("#")[1] : "";
  if (spyIds.includes(id)) spyLinks.set(id, a);
});
if (spyLinks.size) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        spyLinks.forEach((el) => el.classList.remove("active"));
        const el = spyLinks.get(e.target.id);
        if (el) el.classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  spyIds.forEach((id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
}
```

- [ ] **Step 4: Build check** — exit 0.

- [ ] **Step 5: Screenshot full page top + a mid scroll** — `NAME=polish-hero` at `http://localhost:8799/ui/`. Read PNG; confirm hero unchanged (no regression) and nav renders.

- [ ] **Step 6: Commit**

```bash
git add site/public/kf/styles.css site/src/layouts/KfLayout.astro
git commit -m "feat(landing): polish pass — focus rings, arrow nudge, nav scroll-spy"
```

---

### Task 6: Full-page verification (desktop + mobile)

**Files:** none (verification only).

- [ ] **Step 1: Build** — Build check helper. Exit 0.

- [ ] **Step 2: Desktop full-page screenshot**

Serve dist (helper). Screenshot full page at 1440 width using `--screenshot` with a tall window; or capture each anchor (`#demo`, `#pricing`, `#team`). Read each PNG.

- [ ] **Step 3: Mobile screenshots**

Repeat at `--window-size=390,1400` for `#pricing` and `#team`. Read PNGs; confirm grids collapse to one column and nothing overflows.

- [ ] **Step 4: Regression check**

Compare hero + scroll-board screenshots against pre-change baseline (`/private/tmp/claude-501/.../shot/cur-hero.png`). Confirm hero and board visually unchanged.

- [ ] **Step 5: Final commit (if any screenshot fixes were needed)**

If steps 2-4 required tweaks, commit them:
```bash
git add -A && git commit -m "fix(landing): responsive + regression fixups from verification"
```
Otherwise, no commit — verification passed clean.

---

## Self-Review

**Spec coverage:**
- Demo video → Task 3 ✓
- Pricing (dedup via lib/plans.ts) → Tasks 1–2 ✓
- Team/founders → Task 4 ✓
- Nav "Pricing" link → Task 2 ✓
- Hero secondary CTA → `#demo` → Task 3 ✓
- Polish: button nudge, focus rings, card hover (in each card's CSS), gradient border (price `.is-popular`, demo `.board-glow`) → Tasks 2–5 ✓
- Scroll-spy active nav → Task 5 ✓
- Reduced-motion coverage → Task 5 Step 2 ✓
- Responsive → Task 6 ✓

**Placeholder scan:** No TBD/TODO; all component code is complete and copy-ready.

**Type consistency:** `PLANS`/`Plan` used in Tasks 1–2 match; `TEAM`/`Member` in Task 4 match; `.board-glow`, `.room-chip`, `.hero-pill`, `.section-head.center` reused are all pre-existing classes in `styles.css`.

**Known follow-ups (not blockers):** founders confirm team bios; swap demo clip if Krish prefers `08fd33_4_preview.mp4`.
