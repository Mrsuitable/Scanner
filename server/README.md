# Safety Guardian Backend Placeholder

The frontend intentionally does not contain API keys or direct Vision Language Model calls.

This repo now includes a working Vercel-style serverless endpoint at:

`api/analyze-product.js`

In production, create a backend endpoint such as:

`POST /api/analyze-product`

Then point the frontend to it with:

`VITE_ANALYSIS_ENDPOINT=/api/analyze-product`

Set the server-side key only on your hosting platform:

`OPENAI_API_KEY=sk-your-server-side-key`

Responsibilities:

- Accept a captured image from the browser.
- Validate size and content type.
- Send the image to a Vision Language Model using a server-side API key.
- Use a safety-first prompt that asks for structured JSON only.
- Validate the model response against a strict schema.
- Never classify a low-confidence item as `Safe`.
- Return `Unknown` or `Caution` when the model is uncertain.

See `server/visionApiPlaceholder.js` for route pseudocode.
