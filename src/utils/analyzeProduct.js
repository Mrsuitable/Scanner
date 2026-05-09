import { demoProductMap, mockProducts } from "../data/mockProducts";

const LOW_CONFIDENCE_THRESHOLD = 0.58;
const MOCK_ANALYSIS_DELAY = 850;
const ANALYSIS_ENDPOINT = import.meta.env.VITE_ANALYSIS_ENDPOINT || "/api/analyze-product";

function confidenceLabel(score) {
  if (score >= 0.84) return "high";
  if (score >= LOW_CONFIDENCE_THRESHOLD) return "medium";
  return "low";
}

function cloneProduct(product) {
  return {
    productName: "Unknown Product",
    productCategory: "Unknown",
    dangerLevel: "Unknown",
    confidenceScore: 0,
    primaryWarning: "Unable to identify safely. Do not consume this product.",
    secondaryWarnings: [],
    whatToDoNext: "Ask a trusted person to confirm what it is.",
    shortVoiceMessage:
      "Unknown. Unable to identify safely. Do not consume this product until a trusted person confirms what it is. Confidence: low.",
    detectedText: "No reliable label text detected",
    possibleConfusionRisk: "Unknown products may be confused with food, medicine, cleaners, or cosmetics.",
    ...product,
    secondaryWarnings: Array.isArray(product?.secondaryWarnings) ? [...product.secondaryWarnings] : [],
    analyzedAt: new Date().toISOString(),
  };
}

function safeUnknownResult(overrides = {}) {
  return {
    ...cloneProduct(mockProducts.find((product) => product.id === "unknown")),
    ...overrides,
    dangerLevel: "Unknown",
    confidenceScore: Math.min(overrides.confidenceScore ?? 0.34, LOW_CONFIDENCE_THRESHOLD - 0.01),
    primaryWarning: "Unable to identify safely. Do not consume this product.",
    whatToDoNext: "Do not consume this product until a trusted person confirms what it is.",
    shortVoiceMessage:
      "Unknown. Unable to identify safely. Do not consume this product until a trusted person confirms what it is. Confidence: low.",
  };
}

function enforceSafetyRules(result) {
  if (!result) {
    return safeUnknownResult();
  }

  const normalized = cloneProduct(result);

  if (normalized.confidenceScore < LOW_CONFIDENCE_THRESHOLD && normalized.dangerLevel === "Safe") {
    return safeUnknownResult({
      detectedText: normalized.detectedText || "Low-confidence label text",
      possibleConfusionRisk:
        normalized.possibleConfusionRisk || "Low-confidence results may confuse food with chemicals or medicine.",
    });
  }

  if (normalized.confidenceScore < LOW_CONFIDENCE_THRESHOLD && normalized.dangerLevel !== "Danger") {
    normalized.dangerLevel = "Unknown";
    normalized.primaryWarning = "Unable to identify safely. Do not consume this product.";
    normalized.whatToDoNext = "Ask a trusted person to confirm the product before drinking, touching, spraying, or taking it.";
    normalized.shortVoiceMessage =
      "Unknown. Unable to identify safely. Do not consume this product until a trusted person confirms what it is. Confidence: low.";
  }

  return normalized;
}

export function buildVoiceMessage(result) {
  if (!result) {
    return safeUnknownResult().shortVoiceMessage;
  }

  const confidence = confidenceLabel(result.confidenceScore);

  if (result.dangerLevel === "Unknown") {
    return `Unknown. Unable to identify safely. Do not consume this product until a trusted person confirms what it is. Confidence: ${confidence}.`;
  }

  return (
    result.shortVoiceMessage ||
    `${result.dangerLevel}. This appears to be ${result.productCategory}. ${result.primaryWarning} ${result.whatToDoNext} Confidence: ${confidence}.`
  );
}

async function analyzeWithBackend(imageData) {
  if (!ANALYSIS_ENDPOINT) {
    return null;
  }

  const response = await fetch(ANALYSIS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageData: imageData?.dataUrl || imageData,
      capturedAt: imageData?.capturedAt,
      source: imageData?.source || "camera",
    }),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    return payload?.result || null;
  }

  return response.json();
}

export async function analyzeProductImage(imageData) {
  /*
    Production integration placeholder:

    1. Send the captured image to your backend, never directly to a VLM from the browser:

       const response = await fetch("/api/analyze-product", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ imageData: imageData.dataUrl })
       });
       const result = await response.json();

    2. The backend should hold the API key and call GPT-4o Vision, Claude Vision,
       Gemini Vision, or another Vision Language Model.

    3. Backend VLM prompt:

       "Analyze this household product image for safety. Identify whether it may be
       food, medicine, cleaning chemical, cosmetic, pesticide, or unknown. Read visible
       label text and warning symbols. Prioritize ingestion/contact/breathing risks.
       Return structured JSON with dangerLevel, productCategory, primaryWarning,
       secondaryWarnings, confidenceScore, detectedText, and shortVoiceMessage.
       If unsure, warn the user not to consume it."

    4. Validate the JSON against a strict schema server-side. Never return uncertain
       items as Safe. If confidence is low, classify as Unknown or Caution.
  */

  await new Promise((resolve) => setTimeout(resolve, MOCK_ANALYSIS_DELAY));

  const backendResult = await analyzeWithBackend(imageData).catch(() => null);

  if (backendResult) {
    return enforceSafetyRules({
      ...backendResult,
      analysisMode: "vision-backend",
      shortVoiceMessage: buildVoiceMessage(backendResult),
    });
  }

  return safeUnknownResult({
    productName: "Unverified real-world product",
    productCategory: "Unknown product",
    analysisMode: "safe-unconnected-camera",
    confidenceScore: 0.18,
    secondaryWarnings: [
      "Live camera and photo scans require a connected Vision Language Model backend.",
      "Do not drink, taste, spray, or take this product based on this scan.",
      "Ask a trusted person to confirm the product label.",
    ],
    detectedText: "No real vision analysis is connected yet.",
    possibleConfusionRisk:
      "Without a vision model, the app cannot reliably distinguish food, medicine, cleaners, cosmetics, or pesticides.",
    shortVoiceMessage:
      "Unknown. Live vision analysis is not connected yet. Do not consume this product until a trusted person confirms what it is. Confidence: low.",
  });
}

export async function analyzeDemoProduct(demoKey) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  const productId = demoProductMap[demoKey] || "unknown";
  const mockResult = mockProducts.find((product) => product.id === productId);

  return enforceSafetyRules({
    ...mockResult,
    analysisMode: "mock-demo",
    shortVoiceMessage: buildVoiceMessage(mockResult),
  });
}
