import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { AnimatePresence, motion } from "motion/react";
import { Circle, Flag, Footprints } from "lucide-react";
import TacticalPitch from "./TacticalPitch";
import MatchStatsStrip from "./MatchStatsStrip";
import MatchEventRail from "./MatchEventRail";
import {
  matchSequence, counterTargets, passLines, ballKeyframes, TABS, type Counters,
} from "@/data/matchSequence";

gsap.registerPlugin(ScrollTrigger);

const EASE = "power2.inOut";

function writeCounters(root: HTMLElement, c: Counters) {
  const set = (stat: string, val: string) => {
    const el = root.querySelector<HTMLElement>(`[data-stat="${stat}"]`);
    if (el) el.textContent = val;
  };
  set("possession", `${Math.round(c.possession)}%`);
  set("passes", String(Math.round(c.passes)));
  set("distance", `${c.distance.toFixed(1)} km`);
  set("fte", String(Math.round(c.finalThirdEntries)));
  set("clips", String(Math.round(c.reviewClips)));
  const bar = root.querySelector<HTMLElement>("#kf-poss-bar");
  if (bar) bar.style.width = `${c.possession}%`;
}

// Apply the final, settled state with no animation (reduced-motion fallback).
function applyFinalStatic(root: HTMLElement) {
  writeCounters(root, counterTargets[counterTargets.length - 1]);
  root.querySelectorAll<SVGPathElement>(".kf-pass").forEach((p) => { p.style.strokeDashoffset = "0"; });
  const heat = root.querySelector<SVGGElement>("#kf-heat");
  if (heat) heat.style.opacity = "1";
  const ball = root.querySelector<SVGCircleElement>("#kf-ball");
  const goal = ballKeyframes[ballKeyframes.length - 1];
  if (ball) { ball.setAttribute("cx", String(goal.x)); ball.setAttribute("cy", String(goal.y)); }
  const fill = root.querySelector<HTMLElement>("#kf-tl-fill");
  if (fill) fill.style.width = "100%";
}

export default function ScrollMatchSequence() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{ idx: number; pill: string | null }>({ idx: -1, pill: null });
  const [stateIndex, setStateIndex] = useState(0);
  const [pill, setPill] = useState<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const updateScene = (progress: number) => {
      const idx = Math.min(matchSequence.length - 1, Math.floor(progress * matchSequence.length));
      const nextPill = idx === matchSequence.length - 1 ? (progress < 0.94 ? "shot" : "goal") : null;
      if (idx !== sceneRef.current.idx || nextPill !== sceneRef.current.pill) {
        sceneRef.current = { idx, pill: nextPill };
        setStateIndex(idx);
        setPill(nextPill);
      }
    };

    const mm = gsap.matchMedia();

    // --- full experience ---
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const ticker = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);

      const ball = root.querySelector<SVGCircleElement>("#kf-ball");
      const c: Counters = { ...counterTargets[0] };
      const render = () => writeCounters(root, c);
      render();

      const tl = gsap.timeline({
        defaults: { ease: EASE },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=350%",
          pin: stage,
          scrub: 1,
          onUpdate: (self) => updateScene(self.progress),
        },
      });

      // timeline scrubber fill across the whole sequence
      tl.fromTo("#kf-tl-fill", { width: "6%" }, { width: "100%", ease: "none", duration: 4 }, 0);

      for (let i = 0; i < matchSequence.length - 1; i++) {
        const at = i;
        if (ball) {
          tl.to(ball, { attr: { cx: ballKeyframes[i + 1].x, cy: ballKeyframes[i + 1].y }, duration: 1 }, at);
        }
        const pl = passLines.find((p) => p.revealAt === i + 1);
        if (pl) {
          tl.to(`[data-pass="${pl.id}"]`, { strokeDashoffset: 0, ease: "power2.out", duration: 0.85 }, at + 0.08);
        }
        const t = counterTargets[i + 1];
        tl.to(c, {
          possession: t.possession, passes: t.passes, distance: t.distance,
          finalThirdEntries: t.finalThirdEntries, reviewClips: t.reviewClips,
          duration: 1, ease: "power1.inOut", onUpdate: render,
        }, at);
      }

      // final state: heatmap reveal + ball settle + subtle goal pulse
      tl.to("#kf-heat", { opacity: 1, ease: "power2.out", duration: 0.9 }, 3.05);
      if (ball) tl.to(ball, { attr: { r: 3.1 }, duration: 0.22, yoyo: true, repeat: 1, ease: "power2.out" }, 3.7);

      return () => {
        gsap.ticker.remove(ticker);
        lenis.destroy();
      };
    });

    // --- reduced motion: no pin, settled final state ---
    mm.add("(prefers-reduced-motion: reduce)", () => {
      applyFinalStatic(root);
      sceneRef.current = { idx: matchSequence.length - 1, pill: "goal" };
      setStateIndex(matchSequence.length - 1);
      setPill("goal");
    });

    return () => { mm.revert(); ScrollTrigger.getAll().forEach((s) => s.kill()); };
  }, []);

  const current = matchSequence[stateIndex];

  return (
    <div className="bg-ink text-on-ink">
      {/* copy above */}
      <div className="mx-auto max-w-3xl px-6 pb-10 pt-24 text-center">
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-accent">
          <span className="h-px w-6 bg-gradient-to-r from-green to-accent" /> Match room
        </span>
        <h2 className="mt-5 font-display text-[clamp(28px,4.4vw,46px)] font-medium leading-[1.08] tracking-[-0.02em] text-white">
          From one possession to a coach-ready insight.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-on-ink-soft">
          Watch KornerFlag turn raw match footage into passing, movement, heatmaps, and review
          clips as the play develops.
        </p>
      </div>

      {/* pinned stage */}
      <section ref={rootRef} className="relative">
        <div ref={stageRef} className="flex h-screen items-center justify-center px-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-2 shadow-[0_36px_90px_-30px_rgba(0,0,0,0.7)]">
            {/* top bar */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <div className="text-[12.5px] text-on-ink-soft">
                Match Room · <b className="font-semibold text-on-ink">NC State vs Washington</b>
              </div>
              <div className="ml-auto flex gap-1 rounded-lg bg-white/[0.05] p-1">
                {TABS.map((t) => {
                  const active = current.activeTab === t;
                  return (
                    <button key={t} className="relative rounded-md px-3 py-1.5 text-[12px] font-semibold text-on-ink-soft">
                      {active && (
                        <motion.span
                          layoutId="kf-tab"
                          className="absolute inset-0 rounded-md bg-white/[0.14]"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className={active ? "relative text-white" : "relative"}>{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* body: pitch + rail */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px]">
              <div className="relative border-b border-white/[0.06] md:border-b-0 md:border-r">
                {/* phase label */}
                <div className="pointer-events-none absolute left-4 top-4 z-10">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={current.phase}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-ink/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur"
                    >
                      <Footprints className="h-3 w-3 text-accent" /> {current.phase}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* shot / goal pill */}
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                  <AnimatePresence>
                    {pill && (
                      <motion.div
                        key={pill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
                        className={[
                          "flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-semibold shadow-lg backdrop-blur",
                          pill === "goal" ? "bg-green text-white" : "bg-white/90 text-ink",
                        ].join(" ")}
                      >
                        {pill === "goal" ? <Flag className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
                        {pill === "goal" ? "Goal" : "Shot"}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="aspect-[200/120] w-full">
                  <TacticalPitch />
                </div>
              </div>

              <MatchEventRail activeIndex={stateIndex} />
            </div>

            {/* timeline scrubber */}
            <div className="flex items-center gap-3 border-t border-white/[0.06] px-5 py-3">
              <span className="font-display tabular-nums text-[11px] text-on-ink-soft">{matchSequence[0].time}</span>
              <div className="relative h-[5px] flex-1 rounded-full bg-white/10">
                <div id="kf-tl-fill" className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-green to-accent" style={{ width: "6%" }} />
                {/* clip marker — appears once a review clip exists */}
                <span
                  className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] bg-white transition-opacity duration-300"
                  style={{ left: "88%", opacity: current.reviewClips > 0 ? 1 : 0 }}
                />
              </div>
              <span className="font-display tabular-nums text-[11px] text-on-ink-soft">92:14</span>
            </div>

            <MatchStatsStrip />
          </div>
        </div>
      </section>

      {/* CTA below */}
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-12 text-center">
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_26px_-8px_rgba(44,106,212,0.6)] transition-transform hover:-translate-y-0.5"
        >
          Start with a free one-match analysis
        </a>
      </div>
    </div>
  );
}
