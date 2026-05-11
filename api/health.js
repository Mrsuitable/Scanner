export default function handler(request, response) {
  const apiKey = process.env.AI_API_KEY || process.env.AICREDITS_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl =
    process.env.AI_API_BASE_URL ||
    process.env.AICREDITS_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    (apiKey?.startsWith("sk-live-") || process.env.AICREDITS_API_KEY
      ? "https://api.aicredits.in/v1"
      : "https://api.openai.com/v1");
  const usesAicredits = baseUrl.includes("aicredits.in");

  response.statusCode = 200;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.end(
    JSON.stringify({
      ok: true,
      visionConfigured: Boolean(apiKey),
      provider: usesAicredits ? "AICredits" : "OpenAI-compatible",
      baseUrl,
      model:
        process.env.AI_VISION_MODEL ||
        process.env.AICREDITS_VISION_MODEL ||
        process.env.OPENAI_VISION_MODEL ||
        (usesAicredits ? "openai/gpt-4o-mini" : "gpt-4.1-mini"),
    })
  );
}
