import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Database, ShieldAlert } from "lucide-react";
import CameraScanner from "./components/CameraScanner";
import CuratorDatabase from "./components/CuratorDatabase";
import { EMERGENCY_MESSAGE } from "./components/EmergencyMode";
import SafetyResult from "./components/SafetyResult";
import { analyzeDemoProduct, analyzeProductImage, buildVoiceMessage } from "./utils/analyzeProduct";
import { dangerVibration, primeSpeechVoices, speak, speakStatus, stopSpeech, vibrate } from "./utils/speech";

const demoButtons = [
  { label: "Simulate Bleach", key: "bleach" },
  { label: "Simulate Juice", key: "juice" },
  { label: "Simulate Medicine", key: "medicine" },
  { label: "Simulate Insect Spray", key: "insect-spray" },
  { label: "Simulate Unknown Product", key: "unknown" },
];

function App() {
  const [activeView, setActiveView] = useState("scanner");
  const [result, setResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Starting camera");
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [lastVoiceMessage, setLastVoiceMessage] = useState("");

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  const hasResult = Boolean(result);

  const cameraReady = useCallback(() => {
    setStatusMessage("Camera ready. Point at a product label.");
  }, []);

  const cameraError = useCallback((message) => {
    setStatusMessage(message);
  }, []);

  const speakResult = useCallback(async (safetyResult) => {
    const voiceMessage = buildVoiceMessage(safetyResult);
    setLastVoiceMessage(voiceMessage);
    dangerVibration(safetyResult.dangerLevel);
    await speak(voiceMessage);
  }, []);

  const handleAnalyzeImage = useCallback(
    async (imageData) => {
      setIsScanning(true);
      setEmergencyMessage("");
      setStatusMessage("Scanning product");
      vibrate(50);
      await speakStatus("scanning");

      try {
        const safetyResult = await analyzeProductImage(imageData);
        setResult(safetyResult);
        setStatusMessage(
          safetyResult.analysisMode === "safe-unconnected-camera"
            ? "Vision AI not connected. Unable to identify safely."
            : safetyResult.dangerLevel === "Unknown"
            ? "Unable to identify safely"
            : `${safetyResult.dangerLevel}. Product identified.`
        );
        await speakResult(safetyResult);
      } catch (error) {
        const fallback = {
          dangerLevel: "Unknown",
          productName: "Unknown Product",
          productCategory: "Unknown",
          confidenceScore: 0.2,
          primaryWarning: "Unable to identify safely. Do not consume this product.",
          secondaryWarnings: ["Do not taste, spray, mix, or touch your face after handling it."],
          whatToDoNext: "Ask a trusted person to confirm what it is.",
          detectedText: "Analysis failed",
          possibleConfusionRisk: "Unknown products can be confused with food, medicine, or cleaning chemicals.",
          shortVoiceMessage:
            "Unknown. Unable to identify safely. Do not consume this product until a trusted person confirms what it is. Confidence: low.",
        };
        setResult(fallback);
        setStatusMessage("Unable to identify safely");
        await speakResult(fallback);
      } finally {
        setIsScanning(false);
      }
    },
    [speakResult]
  );

  const handleDemo = useCallback(
    async (demoKey) => {
      setActiveView("scanner");
      setIsScanning(true);
      setEmergencyMessage("");
      setStatusMessage("Running demo scan");
      vibrate(45);
      await speakStatus("scanning");

      const safetyResult = await analyzeDemoProduct(demoKey);
      setResult(safetyResult);
      setStatusMessage(
        safetyResult.dangerLevel === "Unknown"
          ? "Demo result. Unable to identify safely."
          : `Demo result. ${safetyResult.dangerLevel}.`
      );
      setIsScanning(false);
      await speakResult(safetyResult);
    },
    [speakResult]
  );

  const handleEmergency = useCallback(async () => {
    setEmergencyMessage(EMERGENCY_MESSAGE);
    setStatusMessage("Emergency mode active");
    setLastVoiceMessage(EMERGENCY_MESSAGE);
    vibrate([160, 80, 160, 80, 260]);
    await speak(EMERGENCY_MESSAGE);
  }, []);

  const repeatWarning = useCallback(async () => {
    const message = result ? buildVoiceMessage(result) : emergencyMessage || lastVoiceMessage;
    if (!message) {
      await speak("No warning is available yet. Scan a product or use demo mode.");
      return;
    }

    setLastVoiceMessage(message);
    await speak(message);
  }, [emergencyMessage, lastVoiceMessage, result]);

  const clearResult = useCallback(async () => {
    stopSpeech();
    setResult(null);
    setEmergencyMessage("");
    setLastVoiceMessage("");
    setStatusMessage("Ready to scan");
    vibrate(30);
    await speakStatus("cleared");
  }, []);

  const scannerControls = useMemo(
    () => (
      <div className="border-t border-white/10 bg-slate-950 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-guardian-yellow">Demo mode</p>
              <p className="mt-1 text-base text-slate-200">Test the safety flow without camera access.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {demoButtons.map((button) => (
              <button
                key={button.key}
                type="button"
                onClick={() => handleDemo(button.key)}
                disabled={isScanning}
                className="min-h-[58px] rounded-2xl border border-white/15 bg-guardian-panel px-4 py-3 text-base font-extrabold text-white transition hover:border-guardian-yellow hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-400"
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
    [handleDemo, isScanning]
  );

  return (
    <div className="min-h-screen bg-guardian-navy text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-guardian-yellow focus:px-4 focus:py-3 focus:font-black focus:text-guardian-navy"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-guardian-navy/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-guardian-yellow p-2 text-guardian-navy">
              <ShieldAlert aria-hidden="true" size={30} strokeWidth={2.6} />
            </div>
            <div>
              <p className="text-2xl font-black tracking-normal">Safety Guardian</p>
              <p className="text-sm font-semibold text-slate-300">Zero-search product safety assistant</p>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2" aria-label="Primary navigation">
            <button
              type="button"
              onClick={() => setActiveView("scanner")}
              className={`flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                activeView === "scanner"
                  ? "bg-guardian-yellow text-guardian-navy"
                  : "border border-white/15 bg-slate-900 text-white hover:bg-slate-800"
              }`}
              aria-current={activeView === "scanner" ? "page" : undefined}
            >
              <Camera aria-hidden="true" size={20} />
              Scanner
            </button>
            <button
              type="button"
              onClick={() => setActiveView("curator")}
              className={`flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                activeView === "curator"
                  ? "bg-guardian-yellow text-guardian-navy"
                  : "border border-white/15 bg-slate-900 text-white hover:bg-slate-800"
              }`}
              aria-current={activeView === "curator" ? "page" : undefined}
            >
              <Database aria-hidden="true" size={20} />
              Database
            </button>
          </nav>
        </div>
      </header>

      <div className="sr-live" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      <main id="main-content">
        {activeView === "scanner" ? (
          <>
            <CameraScanner
              onCapture={handleAnalyzeImage}
              onRepeat={repeatWarning}
              onClear={clearResult}
              onEmergency={handleEmergency}
              onCameraError={cameraError}
              onCameraReady={cameraReady}
              isScanning={isScanning}
              statusMessage={statusMessage}
              emergencyMessage={emergencyMessage}
              hasResult={hasResult}
            />

            {result ? (
              <SafetyResult
                result={result}
                onRepeat={repeatWarning}
                onClear={clearResult}
                onScanAgain={clearResult}
              />
            ) : null}

            {scannerControls}
          </>
        ) : (
          <CuratorDatabase />
        )}
      </main>
    </div>
  );
}

export default App;
