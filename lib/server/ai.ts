import { createHmac } from "node:crypto";
import { DAILY_LIMIT, DEFAULT_GROQ_FALLBACK_MODEL, DEFAULT_GROQ_MODEL, DEFAULT_MODEL } from "@/lib/enhance";

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
      fallback: process.env.AI_FALLBACK_MODEL || DEFAULT_GROQ_FALLBACK_MODEL,
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
      fallback: process.env.AI_FALLBACK_MODEL || null,
      extra: {} as Record<string, unknown>,
    };
  }
  return null;
}

// A daily cap on AI requests per address, behind the per-browser daily limit (which clearing
// browser data resets) and the Vercel Firewall's per-minute rate limit. Counted in Upstash Redis
// when it's connected, so every server instance shares one count. Without it, or when Redis doesn't
// answer in time, each server counts in its own memory, which resets when the server restarts.
// Chat turns count here (but not toward the user's visible allowance), so leave room for them.
export const SERVER_LIMIT = DAILY_LIMIT * 5;
const usage = new Map<string, { day: string; count: number }>();
// Counts outlive their day a little, so one that starts just before midnight UTC isn't cut short
const COUNT_TTL_SECONDS = 2 * 24 * 60 * 60;

// Set by Vercel's Upstash integration; the UPSTASH_ names are what Upstash itself uses
function redis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

// Adds one to today's count for this address and returns the new count, or null if Redis isn't
// connected or doesn't answer. The address is stored only as a keyed hash, never as itself.
async function countInRedis(ip: string, day: string) {
  const db = redis();
  if (!db) return null;
  const key = `ai:${day}:${createHmac("sha256", db.token).update(ip).digest("base64url")}`;
  try {
    const response = await fetch(`${db.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${db.token}` },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(COUNT_TTL_SECONDS)],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return null;
    const [counted] = (await response.json()) as { result?: unknown }[];
    return typeof counted?.result === "number" ? counted.result : null;
  } catch {
    return null;
  }
}

function countInMemory(ip: string, day: string) {
  const entry = usage.get(ip);
  const count = (entry?.day === day ? entry.count : 0) + 1;
  usage.set(ip, { day, count });
  return count;
}

export async function overServerLimit(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const count = (await countInRedis(ip, day)) ?? countInMemory(ip, day);
  return count > SERVER_LIMIT;
}

export function aiError(code: AiErrorCode) {
  const status = { not_configured: 503, busy: 503, failed: 502, limit: 429, bad_request: 400 }[code];
  return Response.json({ error: code }, { status });
}

type ChatOptions = {
  maxTokens?: number;
  timeoutMs?: number;
  reasoning?: "low" | "medium";
  temperature?: number;
  // Whether a busy main model may hand over to the smaller one. Off for careful copying (import,
  // Build with AI, cover letters): the small model drops whole jobs, so waiting is better.
  fallback?: boolean;
};
type ChatResult = { content: string } | { error: AiErrorCode; retryAfterMs?: number };

// How long to wait before asking a busy model again, when the provider doesn't say
export const RETRY_DELAY_MS = 1500;
// Never wait longer than this for a busy model; the person is watching a spinner
const MAX_RETRY_DELAY_MS = 8000;
// Don't start another try with less time than this left; it would only time out
const MIN_TRY_MS = 5000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Waits on a busy main model before giving up: up to this many more tries
const MAX_WAITS = 2;

// Sends a chat request that must answer in JSON. Returns the raw JSON text, or an error code.
//
// Groq's free tier limits each model separately (8,000 tokens a minute each), so when the main
// model is busy the smaller fallback model usually isn't: try it straight away, unless the
// call asks not to. Then wait as long as the provider asks (within limits) and try the main
// model again, up to MAX_WAITS times. Everything stays within the one time limit.
export async function chatJson(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
  const ai = provider();
  if (!ai) return { error: "not_configured" };

  const deadline = Date.now() + (options.timeoutMs ?? 20_000);
  const timeLeft = () => deadline - Date.now();

  let result = await chatOnce(ai, ai.model, messages, options, timeLeft());
  if (!isBusy(result)) return result;

  if (options.fallback !== false && ai.fallback && ai.fallback !== ai.model && timeLeft() >= MIN_TRY_MS) {
    result = await chatOnce(ai, ai.fallback, messages, options, timeLeft());
    if (!isBusy(result)) return result;
  }

  for (let i = 0; i < MAX_WAITS; i++) {
    const delay = Math.min(result.retryAfterMs ?? RETRY_DELAY_MS, MAX_RETRY_DELAY_MS);
    if (timeLeft() < delay + MIN_TRY_MS) break;
    await wait(delay);
    result = await chatOnce(ai, ai.model, messages, options, timeLeft());
    if (!isBusy(result)) return result;
  }
  return { error: "busy" };
}

function isBusy(result: ChatResult): result is { error: "busy"; retryAfterMs?: number } {
  return "error" in result && result.error === "busy";
}

// "retry-after" is in seconds
function retryAfterMs(response: Response) {
  const seconds = Number(response.headers.get("retry-after"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : undefined;
}

async function chatOnce(
  ai: NonNullable<ReturnType<typeof provider>>,
  model: string,
  messages: ChatMessage[],
  { maxTokens = 1500, reasoning = "low", temperature = 0.3 }: ChatOptions,
  timeoutMs: number,
): Promise<ChatResult> {
  let response: Response;
  try {
    response = await fetch(ai.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${ai.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature,
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
  if (response.status === 402 || response.status === 429) return { error: "busy", retryAfterMs: retryAfterMs(response) };
  if (!response.ok) return { error: "failed" };

  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? { content } : { error: "failed" };
}
