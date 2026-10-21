import { extractText } from "unpdf";
import { MAX_IMPORT_LENGTH, buildImportMessages, parseImport } from "@/lib/importer";
import { aiError, chatJson, overServerLimit } from "@/lib/server/ai";

// Reads an existing resume (an uploaded PDF, or pasted text) and sorts it into Folio's fields.
// The file is only read in memory to get its text; nothing is stored.

const MAX_FILE_BYTES = 4 * 1024 * 1024;

async function readText(request: Request): Promise<string | Response> {
  const type = request.headers.get("content-type") ?? "";

  if (type.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return aiError("bad_request");
    if (file.size > MAX_FILE_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
    try {
      const { text } = await extractText(new Uint8Array(await file.arrayBuffer()), { mergePages: true });
      return text;
    } catch {
      return Response.json({ error: "unreadable" }, { status: 422 });
    }
  }

  const body = await request.json().catch(() => null);
  return typeof body?.text === "string" ? body.text : "";
}

export async function POST(request: Request) {
  const text = await readText(request);
  if (text instanceof Response) return text;

  const clean = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  // Scanned resumes are images with no text layer
  if (clean.length < 100) return Response.json({ error: "unreadable" }, { status: 422 });
  if (overServerLimit(request)) return aiError("limit");

  const reply = await chatJson(buildImportMessages(clean.slice(0, MAX_IMPORT_LENGTH)), {
    maxTokens: 6000,
    timeoutMs: 45_000,
  });
  if ("error" in reply) return aiError(reply.error);

  const resume = parseImport(reply.content);
  return resume ? Response.json({ resume }) : aiError("failed");
}
