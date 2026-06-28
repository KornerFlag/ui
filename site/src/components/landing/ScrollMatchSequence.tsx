import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { AnimatePresence, motion } from "motion/react";
import { Circle, Flag, Footprints, Shield } from "lucide-react";
import TacticalPitch from "./TacticalPitch";
import MatchStatsStrip from "./MatchStatsStrip";
import MatchEventRail from "./MatchEventRail";
import {
  matchSequence, passLines, ballKeyframes, playerRuns, TABS, type Tab,
} from "@/data/matchSequence";

gsap.registerPlugin(ScrollTrigger);

// Apply the final, settled state with no animation (reduced-motion fallback).
function applyFinalStatic(root: HTMLElement) {
  root.querySelectorAll<SVGPathElement>(".kf-pass").forEach((p) => { p.style.strokeDashoffset = "0"; });
  const heat = root.querySelector<SVGGElement>("#kf-heat");
  if (heat) heat.style.opacity = "1";
  const ball = root.querySelector<SVGGElement>("#kf-ball");
  const goal = ballKeyframes[ballKeyframes.length - 1];
  if (ball) ball.setAttribute("transform", `translate(${goal.x} ${goal.y})`);
  const fill = root.querySelector<HTMLElement>("#kf-tl-fill");
  if (fill) fill.style.width = "100%";
}

export default function ScrollMatchSequence() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{ idx: number; pill: string | null }>({ idx: -1, pill: null });
  const [stateIndex, setStateIndex] = useState(0);
  const [pill, setPill] = useState<string | null>(null);
  const [manualTab, setManualTab] = useState<Tab | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const updateScene = (progress: number) => {
      const idx = Math.min(matchSequence.length - 1, Math.floor(progress * matchSequence.length));
      const nextPill = idx === 4 ? "shot" : idx === 5 ? "save" : idx === 6 ? "goal" : null;
      if (idx !== sceneRef.current.idx || nextPill !== sceneRef.current.pill) {
        if (idx !== sceneRef.current.idx) setManualTab(null); // scrolling resumes auto tab control
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

      const ball = root.querySelector<SVGGElement>("#kf-ball");
      if (ball) gsap.set(ball, { transformOrigin: "center", x: ballKeyframes[0].x, y: ballKeyframes[0].y, rotation: 0 });

      const segs = matchSequence.length - 1; // 6

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: `+=${segs * 110}%`,
          pin: stage,
          scrub: 1,
          onUpdate: (self) => updateScene(self.progress),
        },
      });

      // timeline scrubber fill across the whole sequence
      tl.fromTo("#kf-tl-fill", { width: "6%" }, { width: "100%", ease: "none", duration: segs }, 0);

      // Ball and the line draw share identical start, duration and easing so the
      // ball rides the tip of the line as it draws; the ball spins as it rolls.
      for (let i = 0; i < segs; i++) {
        const at = i;
        const STEP = { duration: 1, ease: "power1.inOut" } as const;
        const from = ballKeyframes[i];
        const to = ballKeyframes[i + 1];
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        if (ball) {
          tl.to(ball, { x: to.x, y: to.y, rotation: `+=${Math.round(dist * 9)}`, ...STEP }, at);
        }
        const pl = passLines.find((p) => p.revealAt === i + 1);
        if (pl) {
          tl.to(`[data-pass="${pl.id}"]`, { strokeDashoffset: 0, ...STEP }, at);
        }
        // scripted player runs for this segment
        playerRuns.filter((r) => r.atSegment === i).forEach((r) => {
          tl.to(`.kf-player[data-num="${r.num}"][data-side="${r.side}"]`, { x: `+=${r.dx}`, y: `+=${r.dy}`, ...STEP }, at);
        });
      }

      // (heatmap visibility is driven by the active tab — see effect below — so it
      //  builds at the goal state and can also be toggled by clicking the Heat tab)
      // subtle goal pop on the ball
      if (ball) tl.to(ball, { scale: 1.35, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }, segs - 0.2);

      // continuous idle drift — players keep moving throughout (not scroll-bound)
      gsap.utils.toArray<SVGGElement>(root.querySelectorAll(".kf-drift")).forEach((el) => {
        gsap.to(el, {
          x: "random(-1.8,1.8)", y: "random(-1.8,1.8)",
          duration: "random(1.6,3.2)", ease: "sine.inOut", repeat: -1, yoyo: true, delay: "random(0,1.2)",
        });
      });

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
  // active tab follows the scroll state, unless the user clicks one to peek.
  const effectiveTab: Tab = manualTab ?? current.activeTab;

  // heatmap shows whenever the Heat tab is active (at the goal state, or on click).
  // When it appears it builds in — blobs scale up in a quick stagger.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const heat = root.querySelector<SVGGElement>("#kf-heat");
    if (!heat) return;
    if (effectiveTab === "Heat") {
      heat.style.opacity = "1";
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const blobs = root.querySelectorAll(".kf-heatblob");
      if (reduce) {
        gsap.set(blobs, { scale: 1, transformOrigin: "center" });
      } else {
        gsap.fromTo(blobs, { scale: 0, transformOrigin: "center" }, { scale: 1, stagger: 0.05, duration: 0.5, ease: "power2.out" });
      }
    } else {
      heat.style.opacity = "0";
    }
  }, [effectiveTab]);

  return (
    <div className="kf-seq bg-ink text-on-ink">
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
                  const active = effectiveTab === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setManualTab(t)}
                      className="relative cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-semibold text-on-ink-soft transition-colors hover:text-white"
                    >
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
                          pill === "goal" ? "bg-green text-white"
                            : pill === "save" ? "bg-[#E8C76B] text-ink"
                            : "bg-white/90 text-ink",
                        ].join(" ")}
                      >
                        {pill === "goal" ? <Flag className="h-4 w-4" />
                          : pill === "save" ? <Shield className="h-3.5 w-3.5" />
                          : <Circle className="h-3.5 w-3.5" />}
                        {pill === "goal" ? "Goal" : pill === "save" ? "Save" : "Shot"}
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

            <MatchStatsStrip stateIndex={stateIndex} />
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
