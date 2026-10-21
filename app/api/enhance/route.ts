import {
  DAILY_LIMIT,
  DEFAULT_GROQ_MODEL,
  DEFAULT_MODEL,
  buildMessages,
  parseResult,
  validateRequest,
} from "@/lib/enhance";

// Polishes resume text with an OpenAI-compatible chat API. The browser only sends the one
// piece of text the user chose to enhance.
//
// Providers, in order of preference:
// - Groq, when GROQ_API_KEY is set (free tier, no card needed)
// - Vercel AI Gateway, using AI_GATEWAY_API_KEY or the deployment's own VERCEL_OIDC_TOKEN
//   (free monthly credit once the Vercel team has a card on file)

function provider() {
  if (process.env.GROQ_API_KEY) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      token: process.env.GROQ_API_KEY,
      model: process.env.AI_MODEL || DEFAULT_GROQ_MODEL,
      // GPT-OSS is a reasoning model; light editing doesn't need much thinking
      extra: { reasoning_effort: "low" },
    };
  }
  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (token) {
    return {
      url: "https://ai-gateway.vercel.sh/v1/chat/completions",
      token,
      model: process.env.AI_MODEL || DEFAULT_MODEL,
      extra: {},
    };
  }
  return null;
}

// Best-effort backstop against abuse, on top of the per-browser daily limit. It lives in
// server memory, so it resets when the server restarts; enough for a free, small-scale tool.
const usage = new Map<string, { day: string; count: number }>();
const SERVER_LIMIT = DAILY_LIMIT * 2;

function overServerLimit(ip: string) {
  const day = new Date().toISOString().slice(0, 10);
  const entry = usage.get(ip);
  const count = entry?.day === day ? entry.count : 0;
  if (count >= SERVER_LIMIT) return true;
  usage.set(ip, { day, count: count + 1 });
  return false;
}

function error(code: string, status: number) {
  return Response.json({ error: code }, { status });
}

export async function POST(request: Request) {
  const ai = provider();
  if (!ai) return error("not_configured", 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("bad_request", 400);
  }
  const enhanceRequest = validateRequest(body);
  if (typeof enhanceRequest === "string") return error("bad_request", 400);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (overServerLimit(ip)) return error("limit", 429);

  let response: Response;
  try {
    response = await fetch(ai.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${ai.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ai.model,
        messages: buildMessages(enhanceRequest),
        temperature: 0.3,
        // Room for the model's thinking as well as the answer
        max_tokens: 1500,
        response_format: { type: "json_object" },
        ...ai.extra,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return error("failed", 502);
  }

  // 401/403: bad key, or Vercel AI Gateway still waiting for a card to unlock free credits
  if (response.status === 401 || response.status === 403) return error("not_configured", 503);
  // Rate limits, or the free allowance running out
  if (response.status === 402 || response.status === 429) return error("busy", 503);
  if (!response.ok) return error("failed", 502);

  const data = await response.json().catch(() => null);
  const result = parseResult(data?.choices?.[0]?.message?.content, enhanceRequest.kind);
  if (!result) return error("failed", 502);

  return Response.json(result);
}
