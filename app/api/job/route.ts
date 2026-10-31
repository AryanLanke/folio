import { buildJobMessages, parseJobAnalysis, validateJob } from "@/lib/jobmatch";
import { aiError, chatJson, overServerLimit } from "@/lib/server/ai";

// Reads a job posting and lists the skills and terms it asks for
export async function POST(request: Request) {
  const description = validateJob(await request.json().catch(() => null));
  if (!description) return aiError("bad_request");
  if (await overServerLimit(request)) return aiError("limit");

  const reply = await chatJson(buildJobMessages(description));
  if ("error" in reply) return aiError(reply.error);

  const analysis = parseJobAnalysis(reply.content);
  return analysis ? Response.json(analysis) : aiError("failed", "job match: answer wasn't in the expected shape");
}
