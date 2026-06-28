import NumberFlow from "@number-flow/react";
import { matchSequence, passCompletion } from "@/data/matchSequence";

const ONE_DP = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-on-ink-mute">{label}</span>
      <span className="font-display text-[15px] font-medium leading-none text-on-ink">{children}</span>
    </div>
  );
}

// Integrated stat strip. Values roll smoothly between states via NumberFlow as
// the scroll advances the active state.
export default function MatchStatsStrip({ stateIndex }: { stateIndex: number }) {
  const s = matchSequence[stateIndex];
  const poss = parseFloat(s.possession);
  const passPct = parseFloat(passCompletion[stateIndex]);

  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-white/[0.06] px-5 py-3.5">
      {/* possession with bar */}
      <div className="flex min-w-[150px] flex-1 flex-col gap-1.5">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-on-ink-mute">Possession</span>
        <div className="flex items-center gap-2.5">
          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out" style={{ width: `${poss}%` }} />
          </div>
          <span className="font-display text-[13px] font-medium text-on-ink">
            <NumberFlow value={poss} suffix="%" />
          </span>
        </div>
      </div>

      <Stat label="Pass completion"><NumberFlow value={passPct} suffix="%" /></Stat>
      <Stat label="Passes completed"><NumberFlow value={s.passes} /></Stat>
      <Stat label="Team distance"><NumberFlow value={parseFloat(s.distance)} format={ONE_DP} suffix=" km" /></Stat>
      <Stat label="Final-third entries"><NumberFlow value={s.finalThirdEntries} /></Stat>
      <Stat label="Review clips"><NumberFlow value={s.reviewClips} /></Stat>
    </div>
  );
}
