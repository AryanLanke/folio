import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GROQ_FALLBACK_MODEL, DEFAULT_GROQ_MODEL } from "@/lib/enhance";
import { chatJson } from "@/lib/server/ai";

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
