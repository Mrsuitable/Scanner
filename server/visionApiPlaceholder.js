/*
  Example backend route pseudocode.

  This file is intentionally not imported by the Vite frontend. It shows where
  the server-side VLM call should happen so no API key is exposed to users.

  A working Vercel-style implementation is available at:
  api/analyze-product.js

  app.post("/api/analyze-product", async (req, res) => {
    const { imageData } = req.body;

    validateImageData(imageData);

    const prompt = `
      Analyze this household product image for safety. Identify whether it may be
      food, medicine, cleaning chemical, cosmetic, pesticide, or unknown. Read visible
      label text and warning symbols. Prioritize ingestion/contact/breathing risks.
      Return structured JSON with dangerLevel, productCategory, primaryWarning,
      secondaryWarnings, confidenceScore, detectedText, and shortVoiceMessage.
      If unsure, warn the user not to consume it.
    `;

    const vlmResult = await visionClient.responses.create({
      model: process.env.VISION_MODEL,
      input: [
        { role: "system", content: "You are a safety-first product identification assistant." },
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageData }
          ]
        }
      ],
      response_format: { type: "json_schema", json_schema: safetySchema }
    });

    const result = validateSafetySchema(vlmResult);

    if (result.confidenceScore < 0.58 && result.dangerLevel === "Safe") {
      result.dangerLevel = "Unknown";
      result.primaryWarning = "Unable to identify safely. Do not consume this product.";
      result.shortVoiceMessage =
        "Unknown. Unable to identify safely. Do not consume this product until a trusted person confirms what it is. Confidence: low.";
    }

    res.json(result);
  });
*/
