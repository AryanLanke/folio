import { buildMessages, parseResult, validateRequest } from "@/lib/enhance";
import { aiError, chatJson, overServerLimit } from "@/lib/server/ai";

// Polishes one piece of resume text. The browser only sends the text the user chose to enhance.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const enhanceRequest = validateRequest(body);
  if (typeof enhanceRequest === "string") return aiError("bad_request");
  if (await overServerLimit(request)) return aiError("limit");

  // "Another version" should actually come out different, so it gets more variety
  const reply = await chatJson(buildMessages(enhanceRequest), {
    temperature: enhanceRequest.style === "another" ? 0.8 : 0.3,
  });
  if ("error" in reply) return aiError(reply.error);

  const result = parseResult(reply.content, enhanceRequest.kind);
  return result ? Response.json(result) : aiError("failed", "enhance: answer wasn't in the expected shape");
}
