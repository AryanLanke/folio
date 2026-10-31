import { buildInterviewMessages, parseInterviewReply, validateChat } from "@/lib/interview";
import { aiError, chatJson, overServerLimit } from "@/lib/server/ai";

// One turn of the "Tell AI about yourself" chat: the assistant's next question
export async function POST(request: Request) {
  const turns = validateChat(await request.json().catch(() => null));
  if (!turns) return aiError("bad_request");
  if (await overServerLimit(request)) return aiError("limit");

  const reply = await chatJson(buildInterviewMessages(turns), { temperature: 0.5 });
  if ("error" in reply) return aiError(reply.error);

  const next = parseInterviewReply(reply.content);
  return next ? Response.json(next) : aiError("failed");
}
