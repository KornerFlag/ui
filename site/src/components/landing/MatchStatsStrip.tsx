import { matchSequence } from "@/data/matchSequence";

const s0 = matchSequence[0];

function Stat({ label, stat, initial }: { label: string; stat: string; initial: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-on-ink-mute">{label}</span>
      <span data-stat={stat} className="font-display tabular-nums text-[15px] font-medium leading-none text-on-ink">
        {initial}
      </span>
    </div>
  );
}

// Integrated stat strip. Values carry data-stat hooks; the GSAP timeline writes
// into them as the user scrolls. Initial values are the build-up state.
export default function MatchStatsStrip() {
  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-white/[0.06] px-5 py-3.5">
      {/* possession with bar */}
      <div className="flex min-w-[150px] flex-1 flex-col gap-1.5">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-on-ink-mute">Possession</span>
        <div className="flex items-center gap-2.5">
          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/10">
            <div id="kf-poss-bar" className="h-full rounded-full bg-accent" style={{ width: s0.possession }} />
          </div>
          <span data-stat="possession" className="font-display tabular-nums text-[13px] font-medium text-on-ink">
            {s0.possession}
          </span>
        </div>
      </div>

      <Stat label="Passes completed" stat="passes" initial={String(s0.passes)} />
      <Stat label="Team distance" stat="distance" initial={s0.distance} />
      <Stat label="Final-third entries" stat="fte" initial={String(s0.finalThirdEntries)} />
      <Stat label="Review clips" stat="clips" initial={String(s0.reviewClips)} />
    </div>
  );
}
