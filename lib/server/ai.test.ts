import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GROQ_FALLBACK_MODEL, DEFAULT_GROQ_MODEL } from "@/lib/enhance";
import { chatJson, overServerLimit, SERVER_LIMIT } from "@/lib/server/ai";

const answer = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
const busy = (retryAfter?: number) =>
  new Response("{}", { status: 429, headers: retryAfter ? { "retry-after": String(retryAfter) } : {} });

// Records which model each request asked for, and answers from a list in order
function fakeProvider(responses: Response[]) {
  const models: string[] = [];
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    models.push(JSON.parse(String(init.body)).model);
    return responses.shift() ?? busy();
  });
  vi.stubGlobal("fetch", fetchMock);
  return models;
}

describe("chatJson when the AI is busy", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "");
    vi.stubEnv("AI_FALLBACK_MODEL", "");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("answers straight away when the main model isn't busy", async () => {
    const models = fakeProvider([answer('{"ok":true}')]);
    expect(await chatJson([])).toEqual({ content: '{"ok":true}' });
    expect(models).toEqual([DEFAULT_GROQ_MODEL]);
  });

  it("switches to the smaller model when the main one is busy", async () => {
    const models = fakeProvider([busy(), answer('{"from":"fallback"}')]);
    expect(await chatJson([])).toEqual({ content: '{"from":"fallback"}' });
    expect(models).toEqual([DEFAULT_GROQ_MODEL, DEFAULT_GROQ_FALLBACK_MODEL]);
  });

  it("waits as long as the provider asks, then tries the main model again", async () => {
    const models = fakeProvider([busy(), busy(3), answer('{"ok":true}')]);
    const reply = chatJson([]);
    await vi.advanceTimersByTimeAsync(2999);
    expect(models).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(await reply).toEqual({ content: '{"ok":true}' });
    expect(models).toEqual([DEFAULT_GROQ_MODEL, DEFAULT_GROQ_FALLBACK_MODEL, DEFAULT_GROQ_MODEL]);
  });

  it("waits on the main model twice more, then gives up as busy", async () => {
    const models = fakeProvider([busy(), busy(), busy(), busy()]);
    const reply = chatJson([], { timeoutMs: 45_000 });
    await vi.runAllTimersAsync();
    expect(await reply).toEqual({ error: "busy" });
    expect(models).toEqual([DEFAULT_GROQ_MODEL, DEFAULT_GROQ_FALLBACK_MODEL, DEFAULT_GROQ_MODEL, DEFAULT_GROQ_MODEL]);
  });

  it("never uses the smaller model when asked not to, and waits for the main one instead", async () => {
    const models = fakeProvider([busy(2), answer('{"ok":true}')]);
    const reply = chatJson([], { timeoutMs: 45_000, fallback: false });
    await vi.runAllTimersAsync();
    expect(await reply).toEqual({ content: '{"ok":true}' });
    expect(models).toEqual([DEFAULT_GROQ_MODEL, DEFAULT_GROQ_MODEL]);
  });

  it("doesn't wait past the time limit", async () => {
    const models = fakeProvider([busy(), busy(30)]);
    const reply = chatJson([], { timeoutMs: 12_000 });
    await vi.runAllTimersAsync();
    expect(await reply).toEqual({ error: "busy" });
    expect(models).toHaveLength(2);
  });

  it("doesn't retry other errors", async () => {
    const models = fakeProvider([new Response("{}", { status: 500 })]);
    expect(await chatJson([])).toEqual({ error: "failed" });
    expect(models).toHaveLength(1);
  });

  it("uses the fallback model from the environment", async () => {
    vi.stubEnv("AI_FALLBACK_MODEL", "llama-3.1-8b-instant");
    const models = fakeProvider([busy(), answer("{}")]);
    await chatJson([]);
    expect(models[1]).toBe("llama-3.1-8b-instant");
  });
});

describe("overServerLimit", () => {
  const from = (ip: string) => new Request("https://folio.test/api/enhance", { headers: { "x-forwarded-for": ip } });

  // A stand-in for Upstash's REST API: keeps counts by key and records every command
  function fakeRedis() {
    const counts = new Map<string, number>();
    const commands: string[][] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const pipeline = JSON.parse(String(init.body)) as string[][];
        commands.push(...pipeline);
        const results = pipeline.map(([command, key]) => {
          if (command !== "INCR") return { result: 1 };
          counts.set(key, (counts.get(key) ?? 0) + 1);
          return { result: counts.get(key) };
        });
        return Response.json(results);
      }),
    );
    return commands;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("counts in Redis when it's connected, and stops an address once it passes the daily limit", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://redis.test");
    vi.stubEnv("KV_REST_API_TOKEN", "secret");
    fakeRedis();
    for (let i = 0; i < SERVER_LIMIT; i++) expect(await overServerLimit(from("203.0.113.1"))).toBe(false);
    expect(await overServerLimit(from("203.0.113.1"))).toBe(true);
    // Someone else is unaffected
    expect(await overServerLimit(from("203.0.113.2"))).toBe(false);
  });

  it("stores only a hash of the address, and lets each count expire", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://redis.test");
    vi.stubEnv("KV_REST_API_TOKEN", "secret");
    const commands = fakeRedis();
    await overServerLimit(from("203.0.113.3"));
    expect(JSON.stringify(commands)).not.toContain("203.0.113.3");
    expect(commands.map(([command]) => command)).toEqual(["INCR", "EXPIRE"]);
  });

  it("falls back to counting in memory when Redis doesn't answer, instead of blocking everyone", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://redis.test");
    vi.stubEnv("KV_REST_API_TOKEN", "secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    for (let i = 0; i < SERVER_LIMIT; i++) expect(await overServerLimit(from("203.0.113.4"))).toBe(false);
    expect(await overServerLimit(from("203.0.113.4"))).toBe(true);
  });

  it("counts in memory when Redis isn't connected", async () => {
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (let i = 0; i < SERVER_LIMIT; i++) expect(await overServerLimit(from("203.0.113.5"))).toBe(false);
    expect(await overServerLimit(from("203.0.113.5"))).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
