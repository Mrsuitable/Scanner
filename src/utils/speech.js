const statusMessages = {
  cameraReady: "Camera ready",
  scanning: "Scanning",
  productIdentified: "Product identified",
  warning: "Warning",
  unable: "Unable to identify safely",
  cleared: "Result cleared",
};

const voicePreference = {
  voice: null,
  loaded: false,
};

function isSpeechAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function loadPreferredVoice() {
  if (!isSpeechAvailable()) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
  voicePreference.voice =
    englishVoices.find((voice) => /female|samantha|zira|google us english/i.test(voice.name)) ||
    englishVoices[0] ||
    voices[0] ||
    null;
  voicePreference.loaded = true;

  return voicePreference.voice;
}

export function primeSpeechVoices() {
  if (!isSpeechAvailable()) {
    return;
  }

  loadPreferredVoice();
  window.speechSynthesis.onvoiceschanged = loadPreferredVoice;
}

export function stopSpeech() {
  if (isSpeechAvailable()) {
    window.speechSynthesis.cancel();
  }
}

export function speak(message, options = {}) {
  if (!message || !isSpeechAvailable()) {
    return Promise.resolve(false);
  }

  const { interrupt = true, rate = 0.92, pitch = 1, volume = 1, lang = "en-US" } = options;

  if (interrupt) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;
  utterance.voice = voicePreference.loaded ? voicePreference.voice : loadPreferredVoice();

  return new Promise((resolve) => {
    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);
    window.speechSynthesis.speak(utterance);
  });
}

export function speakStatus(statusKey, options = {}) {
  return speak(statusMessages[statusKey] || statusKey, options);
}

export function vibrate(pattern = 45) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function dangerVibration(dangerLevel) {
  if (dangerLevel === "Danger") {
    vibrate([120, 60, 120, 60, 220]);
    return;
  }

  if (dangerLevel === "Caution" || dangerLevel === "Unknown") {
    vibrate([90, 50, 90]);
    return;
  }

  vibrate(45);
}
