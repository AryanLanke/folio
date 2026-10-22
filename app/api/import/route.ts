import { extractLinks, extractText } from "unpdf";
import { MAX_IMPORT_FILE_BYTES, MAX_IMPORT_LENGTH, buildImportMessages, parseImport } from "@/lib/importer";
import { aiError, chatJson, overServerLimit } from "@/lib/server/ai";
import { docxToText } from "@/lib/server/docx-text";

// Reading the file plus one AI call of up to 45 seconds
export const maxDuration = 60;

// Reads an existing resume (an uploaded PDF or Word file, or pasted text) and sorts it into
// Folio's fields. The file is only read in memory to get its text; nothing is stored.

function fileError(code: "too_large" | "unreadable" | "old_word", status: number) {
  return Response.json({ error: code }, { status });
}

async function fileText(file: File): Promise<string | Response> {
  const name = file.name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Old Word files (.doc) use a binary format that can't be read here
  if (name.endsWith(".doc")) return fileError("old_word", 415);
  try {
    if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) return await docxToText(bytes);
    const { text } = await extractText(bytes.slice(), { mergePages: true });
    // Links labelled "LinkedIn" hide their address from the text, so list the addresses too
    const { links } = await extractLinks(bytes.slice()).catch(() => ({ links: [] as string[] }));
    const web = [...new Set(links.filter((link) => /^https?:\/\//i.test(link)))];
    return web.length > 0 ? `${text}\n\nLinks in this file, in the order they appear: ${web.join(", ")}` : text;
  } catch {
    return fileError("unreadable", 422);
  }
}

async function readText(request: Request): Promise<string | Response> {
  const type = request.headers.get("content-type") ?? "";

  if (type.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return aiError("bad_request");
    if (file.size > MAX_IMPORT_FILE_BYTES) return fileError("too_large", 413);
    return fileText(file);
  }

  const body = await request.json().catch(() => null);
  return typeof body?.text === "string" ? body.text : "";
}

export async function POST(request: Request) {
  const text = await readText(request);
  if (text instanceof Response) return text;

  const clean = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  // Scanned resumes are images with no text layer
  if (clean.length < 100) return fileError("unreadable", 422);
  if (overServerLimit(request)) return aiError("limit");

  const reply = await chatJson(buildImportMessages(clean.slice(0, MAX_IMPORT_LENGTH)), {
    maxTokens: 6000,
    timeoutMs: 45_000,
  });
  if ("error" in reply) return aiError(reply.error);

  const resume = parseImport(reply.content);
  return resume ? Response.json({ resume }) : aiError("failed");
}
