import { parseImport } from "@/lib/importer";
import { buildDraftCheckMessages, buildDraftMessages, validateChat } from "@/lib/interview";
import { aiError, chatJson, overServerLimit } from "@/lib/server/ai";

// Two AI calls of up to 45 seconds each (draft, then fact-check), so allow more than the usual limit
export const maxDuration = 120;

// Turns the chat into a resume, then fact-checks the draft against what the person said
export async function POST(request: Request) {
  const turns = validateChat(await request.json().catch(() => null));
  if (!turns) return aiError("bad_request");
  if (await overServerLimit(request)) return aiError("limit");

  const draftReply = await chatJson(buildDraftMessages(turns), { maxTokens: 6000, timeoutMs: 45_000, fallback: false });
  if ("error" in draftReply) return aiError(draftReply.error);
  const draft = parseImport(draftReply.content);
  if (!draft) return aiError("failed");

  const checkedReply = await chatJson(buildDraftCheckMessages(turns, draftReply.content), {
    maxTokens: 6000,
    timeoutMs: 45_000,
    fallback: false,
  });
  // If the check itself fails, the draft is still worth returning
  const checked = "error" in checkedReply ? null : parseImport(checkedReply.content);

  return Response.json({ resume: checked ?? draft });
}
