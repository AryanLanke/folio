import { DAILY_LIMIT, DEFAULT_GROQ_MODEL, DEFAULT_MODEL } from "@/lib/enhance";

// One place for talking to the AI provider, shared by every /api route.
//
// Providers, in order of preference:
// - Groq, when GROQ_API_KEY is set (free tier, no card needed)
// - Vercel AI Gateway, using AI_GATEWAY_API_KEY or the deployment's own VERCEL_OIDC_TOKEN
//   (free monthly credit once the Vercel team has a card on file)

export type ChatMessage = { role: "system" | "user"; content: string };

export type AiErrorCode = "not_configured" | "busy" | "failed" | "limit" | "bad_request";

function provider() {
  if (process.env.GROQ_API_KEY) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      token: process.env.GROQ_API_KEY,
      model: process.env.AI_MODEL || DEFAULT_GROQ_MODEL,
      // GPT-OSS is a reasoning model; these tasks don't need much thinking
      extra: { reasoning_effort: "low" } as Record<string, unknown>,
    };
  }
  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (token) {
    return {
      url: "https://ai-gateway.vercel.sh/v1/chat/completions",
      token,
      model: process.env.AI_MODEL || DEFAULT_MODEL,
      extra: {} as Record<string, unknown>,
    };
  }
  return null;
}

// Best-effort backstop against abuse, on top of the per-browser daily limit. It lives in
// server memory, so it resets when the server restarts; enough for a free, small-scale tool.
const usage = new Map<string, { day: string; count: number }>();
const SERVER_LIMIT = DAILY_LIMIT * 2;

export function overServerLimit(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const entry = usage.get(ip);
  const count = entry?.day === day ? entry.count : 0;
  if (count >= SERVER_LIMIT) return true;
  usage.set(ip, { day, count: count + 1 });
  return false;
}

export function aiError(code: AiErrorCode) {
  const status = { not_configured: 503, busy: 503, failed: 502, limit: 429, bad_request: 400 }[code];
  return Response.json({ error: code }, { status });
}

// Sends a chat request that must answer in JSON. Returns the raw JSON text, or an error code.
export async function chatJson(
  messages: ChatMessage[],
  {
    maxTokens = 1500,
    timeoutMs = 20_000,
    reasoning = "low",
  }: { maxTokens?: number; timeoutMs?: number; reasoning?: "low" | "medium" } = {},
): Promise<{ content: string } | { error: AiErrorCode }> {
  const ai = provider();
  if (!ai) return { error: "not_configured" };

  let response: Response;
  try {
    response = await fetch(ai.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${ai.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ai.model,
        messages,
        temperature: 0.3,
        // Room for the model's thinking as well as the answer
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        ...ai.extra,
        ...(ai.extra.reasoning_effort ? { reasoning_effort: reasoning } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { error: "failed" };
  }

  // 401/403: bad key, or Vercel AI Gateway still waiting for a card to unlock free credits
  if (response.status === 401 || response.status === 403) return { error: "not_configured" };
  // Rate limits, or the free allowance running out
  if (response.status === 402 || response.status === 429) return { error: "busy" };
  if (!response.ok) return { error: "failed" };

  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? { content } : { error: "failed" };
}
