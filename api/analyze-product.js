const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";
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

  const confidenceScore = Number(result.confidenceScore);
  const normalized = {
    ...fallbackUnknown(),
    ...result,
    confidenceScore: Number.isFinite(confidenceScore) ? Math.max(0, Math.min(1, confidenceScore)) : 0.2,
    secondaryWarnings: Array.isArray(result.secondaryWarnings)
      ? result.secondaryWarnings.filter(Boolean).slice(0, 5)
      : fallbackUnknown().secondaryWarnings,
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

function extractOutputText(openaiResponse) {
  if (typeof openaiResponse?.output_text === "string") {
    return openaiResponse.output_text;
  }

  const message = openaiResponse?.output?.find((item) => item.type === "message");
  const textPart = message?.content?.find((part) => part.type === "output_text" || part.type === "text");
  return textPart?.text || "";
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    sendJson(response, 500, {
      error: "Vision AI is not configured. Set OPENAI_API_KEY on the server.",
      result: fallbackUnknown({ detectedText: "OPENAI_API_KEY is missing on the server." }),
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

    const apiResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || DEFAULT_MODEL,
        instructions:
          "You are Safety Guardian, a safety-first household product identification assistant for visually impaired and low-vision users. Prioritize danger warnings over brand details. Never classify an uncertain item as safe.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Analyze this household product image for safety. Identify whether it may be food, medicine, cleaning chemical, cosmetic, pesticide, or unknown. Read visible label text and warning symbols. Prioritize ingestion, contact, and breathing risks. Return structured JSON only. If unsure, warn the user not to consume it.",
              },
              {
                type: "input_image",
                image_url: imageData,
                detail: "high",
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "product_safety_result",
            strict: true,
            schema: safetySchema,
          },
        },
      }),
    });

    const payload = await apiResponse.json();

    if (!apiResponse.ok) {
      sendJson(response, apiResponse.status, {
        error: payload?.error?.message || "Vision AI request failed.",
        result: fallbackUnknown({ detectedText: "Vision AI request failed before a reliable result was returned." }),
      });
      return;
    }

    const outputText = extractOutputText(payload);
    const parsedResult = JSON.parse(outputText);

    sendJson(response, 200, enforceServerSafety(parsedResult));
  } catch (error) {
    sendJson(response, 500, {
      error: "Unable to analyze the product safely.",
      result: fallbackUnknown({ detectedText: "The server could not complete vision analysis safely." }),
    });
  }
}
