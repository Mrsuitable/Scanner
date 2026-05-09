import { AlertTriangle } from "lucide-react";

export const EMERGENCY_MESSAGE =
  "Emergency mode. If this product was swallowed, touched your eyes, or caused breathing difficulty, move away from the product and contact a trusted adult, doctor, or local emergency service immediately.";

export default function EmergencyMode({ onEmergency, message }) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onEmergency}
        className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl bg-red-600 px-5 py-4 text-lg font-black uppercase tracking-wide text-white shadow-danger transition hover:bg-red-500 active:scale-[0.99]"
        aria-label="Emergency mode. Speak urgent safety guidance."
      >
        <AlertTriangle aria-hidden="true" size={30} strokeWidth={2.8} />
        Emergency Mode
      </button>

      {message ? (
        <div
          role="alert"
          className="rounded-2xl border-2 border-red-400 bg-red-950/90 p-4 text-base font-semibold leading-relaxed text-red-50"
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
