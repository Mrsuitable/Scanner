const OPENAI_BASE_URL = "https://api.openai.com/v1";
const AICREDITS_BASE_URL = "https://api.aicredits.in/v1";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_AICREDITS_MODEL = "openai/gpt-4o-mini";
const MAX_IMAGE_DATA_URL_LENGTH = 8_000_000;

const safetySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    productName: { type: "string" },
    productCategory: { type: "string" },
    dangerLevel: { type: "string", enum: ["Safe", "Caution", "Danger", "Unknown"] },
    confidenceScore: { type: "number", minimum: 0, maximum: 1 },
    primaryWarning: { type: "string" },
    secondaryWarnings: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 5,
    },
    whatToDoNext: { type: "string" },
    shortVoiceMessage: { type: "string" },
    detectedText: { type: "string" },
    possibleConfusionRisk: { type: "string" },
  },
  required: [
    "productName",
    "productCategory",
    "dangerLevel",
    "confidenceScore",
    "primaryWarning",
    "secondaryWarnings",
    "whatToDoNext",
    "shortVoiceMessage",
    "detectedText",
    "possibleConfusionRisk",
  ],
};

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_IMAGE_DATA_URL_LENGTH + 100_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function parseJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  const rawBody = typeof request.body === "string" ? request.body : await readBody(request);
  return rawBody ? JSON.parse(rawBody) : {};
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

function getApiConfig() {
  const apiKey = process.env.AI_API_KEY || process.env.AICREDITS_API_KEY || process.env.OPENAI_API_KEY;
  const keyLooksLikeAicredits = Boolean(apiKey?.startsWith("sk-live-") || process.env.AICREDITS_API_KEY);
  const explicitBaseUrl = process.env.AI_API_BASE_URL || process.env.AICREDITS_BASE_URL || process.env.OPENAI_BASE_URL;
  const baseUrl = normalizeBaseUrl(explicitBaseUrl || (keyLooksLikeAicredits ? AICREDITS_BASE_URL : OPENAI_BASE_URL));
  const usesAicredits = baseUrl.includes("aicredits.in");

  return {
    apiKey,
    baseUrl,
    model:
      process.env.AI_VISION_MODEL ||
      process.env.AICREDITS_VISION_MODEL ||
      process.env.OPENAI_VISION_MODEL ||
      (usesAicredits ? DEFAULT_AICREDITS_MODEL : DEFAULT_OPENAI_MODEL),
    provider: usesAicredits ? "AICredits" : "OpenAI-compatible",
  };
}

function fallbackUnknown(overrides = {}) {
  return {
    productName: "Unknown Product",
    productCategory: "Unknown",
    dangerLevel: "Unknown",
    confidenceScore: 0.2,
    primaryWarning: "Unable to identify safely. Do not consume this product.",
    secondaryWarnings: [
      "Do not drink, taste, spray, or take this product based on this scan.",
      "Ask a trusted person to confirm the product label.",
    ],
    whatToDoNext: "Place the product down and ask a trusted person to confirm what it is.",
    shortVoiceMessage:
      "Unknown. Unable to identify safely. Do not consume this product until a trusted person confirms what it is. Confidence: low.",
    detectedText: "No reliable label text detected.",
    possibleConfusionRisk: "Unknown products can be confused with food, medicine, cleaners, cosmetics, or pesticides.",
    ...overrides,
  };
}

function enforceServerSafety(result) {
  if (!result || typeof result !== "object") {
    return fallbackUnknown();
  }

  const fallback = fallbackUnknown();
  const confidenceScore = Number(result.confidenceScore);
  const secondaryWarnings = Array.isArray(result.secondaryWarnings)
    ? result.secondaryWarnings.filter(Boolean).slice(0, 5)
    : [];

  const normalized = {
    ...fallback,
    ...result,
    dangerLevel: ["Safe", "Caution", "Danger", "Unknown"].includes(result.dangerLevel)
      ? result.dangerLevel
      : "Unknown",
    confidenceScore: Number.isFinite(confidenceScore) ? Math.max(0, Math.min(1, confidenceScore)) : 0.2,
    secondaryWarnings: secondaryWarnings.length ? secondaryWarnings : fallback.secondaryWarnings,
  };

  if (normalized.confidenceScore < 0.58 && normalized.dangerLevel === "Safe") {
    return fallbackUnknown({
      detectedText: normalized.detectedText || "Low-confidence label text.",
      possibleConfusionRisk:
        normalized.possibleConfusionRisk ||
        "Low-confidence results may confuse food with chemicals, cosmetics, or medicine.",
    });
  }

  if (normalized.confidenceScore < 0.58 && normalized.dangerLevel !== "Danger") {
    normalized.dangerLevel = "Unknown";
    normalized.primaryWarning = "Unable to identify safely. Do not consume this product.";
    normalized.whatToDoNext = "Ask a trusted person to confirm the product before drinking, touching, spraying, or taking it.";
    normalized.shortVoiceMessage =
      "Unknown. Unable to identify safely. Do not consume this product until a trusted person confirms what it is. Confidence: low.";
  }

  return normalized;
}

function extractChatCompletionText(apiResponse) {
  const content = apiResponse?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const textPart = content.find((part) => part.type === "text" && typeof part.text === "string");
    return textPart?.text || "";
  }

  return "";
}

function parseJsonObject(text) {
  const trimmed = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("The model did not return valid JSON.");
  }
}

function buildPrompt() {
  return [
    "Analyze this household product image for safety.",
    "Identify whether it may be food, medicine, cleaning chemical, cosmetic, pesticide, or unknown.",
    "Read visible label text, warning symbols, color, brand clues, and product shape.",
    "Prioritize ingestion, eye/skin contact, inhalation, fire, and child-safety risks.",
    "Never classify an uncertain item as Safe. If unsure, use Unknown or Caution and warn the user not to consume it.",
    "Return JSON only, with these exact keys: productName, productCategory, dangerLevel, confidenceScore, primaryWarning, secondaryWarnings, whatToDoNext, shortVoiceMessage, detectedText, possibleConfusionRisk.",
    `The JSON must match this schema: ${JSON.stringify(safetySchema)}.`,
  ].join(" ");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const apiConfig = getApiConfig();

  if (!apiConfig.apiKey) {
    sendJson(response, 500, {
      error: "Vision AI is not configured. Set AI_API_KEY, AICREDITS_API_KEY, or OPENAI_API_KEY on the server.",
      result: fallbackUnknown({ detectedText: "No server-side Vision AI API key is configured." }),
    });
    return;
  }

  try {
    const { imageData } = await parseJsonBody(request);

    if (!imageData || typeof imageData !== "string" || !imageData.startsWith("data:image/")) {
      sendJson(response, 400, {
        error: "Expected imageData as a base64 image data URL.",
        result: fallbackUnknown({ detectedText: "No valid image was received by the server." }),
      });
      return;
    }

    if (imageData.length > MAX_IMAGE_DATA_URL_LENGTH) {
      sendJson(response, 413, {
        error: "Image is too large.",
        result: fallbackUnknown({ detectedText: "The image was too large for analysis." }),
      });
      return;
    }

    const apiResponse = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: apiConfig.model,
        temperature: 0,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are Safety Guardian, a safety-first household product identification assistant for visually impaired and low-vision users. Prioritize danger warnings over brand details. Return only valid JSON.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: buildPrompt() },
              {
                type: "image_url",
                image_url: {
                  url: imageData,
                  detail: "high",
                },
              },
            ],
          },
        ],
      }),
    });

    const payload = await apiResponse.json();

    if (!apiResponse.ok) {
      sendJson(response, apiResponse.status, {
        error: payload?.error?.message || `${apiConfig.provider} Vision AI request failed.`,
        result: fallbackUnknown({ detectedText: "Vision AI request failed before a reliable result was returned." }),
      });
      return;
    }

    const outputText = extractChatCompletionText(payload);
    const parsedResult = parseJsonObject(outputText);

    sendJson(response, 200, enforceServerSafety(parsedResult));
  } catch (error) {
    sendJson(response, 500, {
      error: "Unable to analyze the product safely.",
      result: fallbackUnknown({ detectedText: "The server could not complete vision analysis safely." }),
    });
  }
}
