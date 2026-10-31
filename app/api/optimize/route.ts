import { buildOptimizeMessages, parseOptimize, validateOptimize } from "@/lib/optimize";
import { aiError, chatJson, overServerLimit } from "@/lib/server/ai";

// One AI call of up to 45 seconds, with room to spare
export const maxDuration = 60;

// Rewrites the wording of a whole resume in one go, for Optimize. The browser sends only the
// summary and bullet points; parseOptimize throws away anything that would add a fact.
export async function POST(request: Request) {
  const optimizeRequest = validateOptimize(await request.json().catch(() => null));
  if (!optimizeRequest) return aiError("bad_request");
  if (await overServerLimit(request)) return aiError("limit");

  const reply = await chatJson(buildOptimizeMessages(optimizeRequest), { maxTokens: 5000, timeoutMs: 45_000 });
  if ("error" in reply) return aiError(reply.error);

  const result = parseOptimize(reply.content, optimizeRequest);
  return result ? Response.json(result) : aiError("failed");
}
