export default function handler(request, response) {
  response.statusCode = 200;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.end(
    JSON.stringify({
      ok: true,
      visionConfigured: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
    })
  );
}
