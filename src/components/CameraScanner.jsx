import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, RefreshCcw, ShieldCheck, Upload } from "lucide-react";
import EmergencyMode from "./EmergencyMode";
import VoiceControls from "./VoiceControls";
import { speakStatus, vibrate } from "../utils/speech";

const cameraConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
};

function cameraErrorMessage(error) {
  if (!error) {
    return {
      title: "Camera unavailable",
      message: "The browser could not access a camera. Demo mode and photo upload are available below.",
    };
  }

  if (error.name === "NotAllowedError") {
    return {
      title: "Camera permission blocked",
      message:
        "The browser or Windows blocked live camera access. Allow camera for this site, then press Try Camera Again.",
    };
  }

  if (error.name === "NotFoundError") {
    return {
      title: "No camera found",
      message: "No camera was found on this device. Demo mode and photo upload are available below.",
    };
  }

  return {
    title: "Camera could not start",
    message: "Live camera access failed. Demo mode and photo upload are available below.",
  };
}

export default function CameraScanner({
  onCapture,
  onRepeat,
  onClear,
  onEmergency,
  onCameraError,
  onCameraReady,
  isScanning,
  statusMessage,
  emergencyMessage,
  hasResult,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState("starting");
  const [cameraIssue, setCameraIssue] = useState({ title: "", message: "" });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        const issue = {
          title: "Camera unsupported",
          message: "This browser does not support live camera access. Demo mode and photo upload are available below.",
        };
        setCameraState("error");
        setCameraIssue(issue);
        onCameraError?.(issue.message);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia(cameraConstraints);

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraState("ready");
        setCameraIssue({ title: "", message: "" });
        onCameraReady?.();
        vibrate(35);
        speakStatus("cameraReady");
      } catch (error) {
        const issue = cameraErrorMessage(error);
        setCameraState("error");
        setCameraIssue(issue);
        onCameraError?.(issue.message);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [onCameraError, onCameraReady, retryToken]);

  async function captureFrame() {
    if (!videoRef.current || !canvasRef.current || cameraState !== "ready") {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));

    await onCapture({
      dataUrl,
      blob,
      width,
      height,
      capturedAt: new Date().toISOString(),
    });
  }

  function handleFileSelection(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      await onCapture({
        dataUrl: reader.result,
        blob: file,
        width: null,
        height: null,
        capturedAt: new Date().toISOString(),
        source: "file",
      });
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  }

  const canScan = cameraState === "ready" && !isScanning;

  return (
    <section
      aria-label="Camera scanner"
      className="relative min-h-[calc(100svh-92px)] overflow-hidden bg-guardian-navy"
    >
      <div className="absolute inset-0">
        {cameraState === "error" ? (
          <div className="flex h-full items-center justify-center bg-slate-950 px-6 text-center">
            <div className="max-w-md space-y-5">
              <CameraOff className="mx-auto text-guardian-yellow" size={64} aria-hidden="true" />
              <p className="text-2xl font-black">{cameraIssue.title}</p>
              <p className="text-lg leading-relaxed text-slate-200">{cameraIssue.message}</p>
              <button
                type="button"
                onClick={() => {
                  setCameraState("starting");
                  setCameraIssue({ title: "", message: "" });
                  setRetryToken((token) => token + 1);
                }}
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-guardian-yellow px-5 py-3 text-base font-black text-guardian-navy transition hover:bg-yellow-300"
                aria-label="Try camera permission again"
              >
                <RefreshCcw aria-hidden="true" size={22} />
                Try Camera Again
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
            aria-label="Live camera preview"
          />
        )}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/10 to-slate-950/95" />

      <div className="relative z-10 flex min-h-[calc(100svh-92px)] flex-col justify-between p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-2xl border border-white/15 bg-slate-950/75 px-4 py-3 backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-guardian-yellow">Safety Guardian</p>
            <p className="mt-1 text-lg font-black text-white" aria-live="polite">
              {statusMessage}
            </p>
          </div>

          <div
            className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/75 px-4 py-3 text-sm font-bold text-white backdrop-blur"
            aria-label={`Camera status: ${cameraState}`}
          >
            {cameraState === "ready" ? (
              <ShieldCheck aria-hidden="true" className="text-guardian-green" size={21} />
            ) : (
              <Loader2 aria-hidden="true" className="animate-spin text-guardian-yellow" size={21} />
            )}
            {cameraState === "ready" ? "Ready" : cameraState === "error" ? "Demo" : "Starting"}
          </div>
        </div>

        <div className="mx-auto mb-4 w-full max-w-3xl space-y-4">
          <div className="rounded-3xl border border-white/15 bg-slate-950/78 p-4 shadow-2xl backdrop-blur-md sm:p-5">
            <button
              type="button"
              onClick={captureFrame}
              disabled={!canScan}
              className="flex min-h-[76px] w-full items-center justify-center gap-3 rounded-2xl bg-guardian-yellow px-5 py-5 text-xl font-black text-guardian-navy shadow-lg transition hover:bg-yellow-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-800"
              aria-label="Scan product using the camera"
            >
              {isScanning ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={31} />
              ) : (
                <Camera aria-hidden="true" size={31} />
              )}
              {isScanning ? "Scanning" : "Scan Product"}
            </button>

            <div className="mt-3">
              <input
                ref={fileInputRef}
                id="photo-file-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelection}
                className="sr-only"
                aria-label="Use a photo file or take a photo for product analysis"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl border border-guardian-yellow/60 bg-slate-900 px-4 py-3 text-base font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-400"
                aria-label="Use a photo file or take a photo instead of live camera"
              >
                <Upload aria-hidden="true" size={24} />
                Use Photo File
              </button>
            </div>

            <div className="mt-3">
              <VoiceControls
                onRepeat={onRepeat}
                onClear={onClear}
                canRepeat={hasResult || Boolean(emergencyMessage)}
                canClear={hasResult || Boolean(emergencyMessage)}
              />
            </div>
          </div>

          <EmergencyMode onEmergency={onEmergency} message={emergencyMessage} />
        </div>
      </div>
    </section>
  );
}
