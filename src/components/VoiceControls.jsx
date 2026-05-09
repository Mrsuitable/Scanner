import { RotateCcw, Volume2, XCircle } from "lucide-react";

export default function VoiceControls({
  onRepeat,
  onClear,
  onScanAgain,
  canRepeat = false,
  canClear = false,
  showScanAgain = false,
}) {
  return (
    <div className={`grid gap-3 ${showScanAgain ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      <button
        type="button"
        onClick={onRepeat}
        disabled={!canRepeat}
        className="flex min-h-[58px] items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white px-4 py-3 text-base font-extrabold text-guardian-navy transition hover:bg-guardian-yellow disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-800"
        aria-label="Repeat the latest spoken warning"
      >
        <Volume2 aria-hidden="true" size={24} />
        Repeat Warning
      </button>

      {showScanAgain ? (
        <button
          type="button"
          onClick={onScanAgain}
          className="flex min-h-[58px] items-center justify-center gap-3 rounded-2xl border border-guardian-yellow/70 bg-guardian-yellow px-4 py-3 text-base font-extrabold text-guardian-navy transition hover:bg-yellow-300"
          aria-label="Scan another product"
        >
          <RotateCcw aria-hidden="true" size={23} />
          Scan Again
        </button>
      ) : null}

      <button
        type="button"
        onClick={onClear}
        disabled={!canClear}
        className="flex min-h-[58px] items-center justify-center gap-3 rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-base font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        aria-label="Clear the current safety result"
      >
        <XCircle aria-hidden="true" size={23} />
        Clear Result
      </button>
    </div>
  );
}
