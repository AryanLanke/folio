import { buildCoverLetterMessages, buildFactCheckMessages, parseCoverLetter, validateCoverLetter } from "@/lib/coverletter";
import { aiError, chatJson, overServerLimit } from "@/lib/server/ai";

// Two AI calls of up to 30 seconds each (letter, then fact-check)
export const maxDuration = 90;

// Writes a cover letter from the resume (and the target job, if there is one), then runs a
// separate fact-check pass that strikes anything the resume doesn't support.
export async function POST(request: Request) {
  const letterRequest = validateCoverLetter(await request.json().catch(() => null));
  if (!letterRequest) return aiError("bad_request");
  if (await overServerLimit(request)) return aiError("limit");

  const draftReply = await chatJson(buildCoverLetterMessages(letterRequest), { maxTokens: 2500, timeoutMs: 30_000, fallback: false });
  if ("error" in draftReply) return aiError(draftReply.error);
  const draft = parseCoverLetter(draftReply.content);
  if (!draft) return aiError("failed");

  const checkedReply = await chatJson(buildFactCheckMessages(letterRequest.resumeText, draft), {
    maxTokens: 2500,
    timeoutMs: 30_000,
    fallback: false,
  });
  // If the check itself fails, the draft is still worth returning
  const checked = "error" in checkedReply ? null : parseCoverLetter(checkedReply.content);

  return Response.json({ letter: checked ?? draft });
}
