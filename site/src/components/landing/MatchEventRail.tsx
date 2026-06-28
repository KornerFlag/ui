import { AnimatePresence, motion } from "motion/react";
import { matchSequence } from "@/data/matchSequence";

// Compact event rail. Shows the events up to the current scroll state, newest
// highlighted. Motion handles only the small enter/slide of each row.
export default function MatchEventRail({ activeIndex }: { activeIndex: number }) {
  const visible = matchSequence.slice(0, activeIndex + 1);
  const current = matchSequence[activeIndex];
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-on-ink-mute">Event rail</span>
        <span className="font-display tabular-nums text-[11px] text-on-ink-soft">{current.time}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <AnimatePresence initial={false}>
          {visible.map((e, i) => {
            const isCurrent = i === activeIndex;
            return (
              <motion.div
                key={e.phase}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: isCurrent ? 1 : 0.55, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
                className={[
                  "rounded-lg border px-3 py-2",
                  isCurrent
                    ? "border-accent/40 bg-accent/10"
                    : "border-white/[0.05] bg-white/[0.02]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-on-ink">{e.phase}</span>
                  <span className="font-display tabular-nums text-[10px] text-on-ink-mute">{e.time}</span>
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-on-ink-soft">{e.event}</div>
                {e.lastPass && (
                  <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 font-display text-[10px] text-on-ink-soft">
                    {e.lastPass}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
