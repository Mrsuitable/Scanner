import { AlertOctagon, AlertTriangle, CheckCircle2, HelpCircle, ListChecks, ScanLine } from "lucide-react";
import VoiceControls from "./VoiceControls";

function dangerStyles(level) {
  if (level === "Danger") {
    return {
      card: "border-red-400 bg-red-950/60 shadow-danger",
      badge: "bg-red-500 text-white",
      icon: <AlertOctagon aria-hidden="true" size={30} />,
    };
  }

  if (level === "Caution") {
    return {
      card: "border-amber-300 bg-amber-950/50 shadow-caution",
      badge: "bg-guardian-yellow text-guardian-navy",
      icon: <AlertTriangle aria-hidden="true" size={30} />,
    };
  }

  if (level === "Safe") {
    return {
      card: "border-teal-300 bg-teal-950/50",
      badge: "bg-guardian-green text-guardian-navy",
      icon: <CheckCircle2 aria-hidden="true" size={30} />,
    };
  }

  return {
    card: "border-slate-300 bg-slate-900",
    badge: "bg-white text-guardian-navy",
    icon: <HelpCircle aria-hidden="true" size={30} />,
  };
}

function confidencePercent(score) {
  return `${Math.round(score * 100)}%`;
}

export default function SafetyResult({ result, onRepeat, onClear, onScanAgain }) {
  if (!result) {
    return null;
  }

  const styles = dangerStyles(result.dangerLevel);

  return (
    <section className="bg-guardian-navy px-4 py-6 sm:px-6 lg:px-8" aria-label="Safety result">
      <div className="mx-auto max-w-5xl">
        <article className={`rounded-3xl border-2 p-5 transition sm:p-7 ${styles.card}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className={`rounded-2xl p-3 ${styles.badge}`}>{styles.icon}</div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-200">Safety result</p>
                <h2 className="mt-1 text-3xl font-black text-white sm:text-4xl">{result.dangerLevel}</h2>
              </div>
            </div>

            <div className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-sm font-black ${styles.badge}`}>
              {result.dangerLevel} badge
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-300">Product or category</p>
                <p className="mt-2 text-2xl font-black text-white">{result.productCategory}</p>
                <p className="mt-1 text-base text-slate-200">{result.productName}</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-slate-950/50 p-4">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-guardian-yellow">Primary warning</p>
                <p className="mt-2 text-xl font-extrabold leading-snug text-white">{result.primaryWarning}</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2 text-guardian-yellow">
                  <ListChecks aria-hidden="true" size={22} />
                  <p className="text-sm font-bold uppercase tracking-[0.16em]">Secondary warnings</p>
                </div>
                <ul className="mt-3 space-y-2 text-base leading-relaxed text-slate-100">
                  {result.secondaryWarnings.map((warning) => (
                    <li key={warning} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-guardian-yellow" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-white/15 bg-slate-950/50 p-4">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-300">What to do next</p>
                <p className="mt-2 text-lg font-bold leading-relaxed text-white">{result.whatToDoNext}</p>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/15 bg-slate-950/50 p-4">
                  <dt className="text-sm font-bold uppercase tracking-[0.16em] text-slate-300">Confidence</dt>
                  <dd className="mt-1 text-3xl font-black text-white">{confidencePercent(result.confidenceScore)}</dd>
                </div>
                <div className="rounded-2xl border border-white/15 bg-slate-950/50 p-4">
                  <dt className="text-sm font-bold uppercase tracking-[0.16em] text-slate-300">Confusion risk</dt>
                  <dd className="mt-2 text-base font-semibold leading-relaxed text-white">{result.possibleConfusionRisk}</dd>
                </div>
              </dl>

              <div className="rounded-2xl border border-white/15 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2 text-slate-200">
                  <ScanLine aria-hidden="true" size={22} />
                  <p className="text-sm font-bold uppercase tracking-[0.16em]">Detected label text</p>
                </div>
                <p className="mt-3 rounded-xl bg-slate-950 p-3 text-base font-semibold leading-relaxed text-slate-100">
                  {result.detectedText}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <VoiceControls
              onRepeat={onRepeat}
              onClear={onClear}
              onScanAgain={onScanAgain}
              canRepeat
              canClear
              showScanAgain
            />
          </div>
        </article>
      </div>
    </section>
  );
}
