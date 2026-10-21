import { parseImport } from "@/lib/importer";
import { buildDraftCheckMessages, buildDraftMessages, validateChat } from "@/lib/interview";
import { aiError, chatJson, overServerLimit } from "@/lib/server/ai";

// Turns the chat into a resume, then fact-checks the draft against what the person said
export async function POST(request: Request) {
  const turns = validateChat(await request.json().catch(() => null));
  if (!turns) return aiError("bad_request");
  if (overServerLimit(request)) return aiError("limit");

  const draftReply = await chatJson(buildDraftMessages(turns), { maxTokens: 6000, timeoutMs: 45_000 });
  if ("error" in draftReply) return aiError(draftReply.error);
  const draft = parseImport(draftReply.content);
  if (!draft) return aiError("failed");

  const checkedReply = await chatJson(buildDraftCheckMessages(turns, draftReply.content), {
    maxTokens: 6000,
    timeoutMs: 45_000,
  });
  // If the check itself fails, the draft is still worth returning
  const checked = "error" in checkedReply ? null : parseImport(checkedReply.content);

  return Response.json({ resume: checked ?? draft });
}
