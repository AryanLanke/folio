import JSZip from "jszip";

// Pulls the readable text out of a Word (.docx) file. A .docx is a zip archive; the body text
// lives in word/document.xml as paragraphs (<w:p>) made of text runs (<w:t>), with tabs and
// line breaks as their own elements.

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decode(text: string) {
  return text.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

const escapeXml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Hyperlink addresses live in a separate relationships file, keyed by id
async function linkTargets(zip: JSZip) {
  const rels = await zip.file("word/_rels/document.xml.rels")?.async("string");
  const targets = new Map<string, string>();
  for (const m of rels?.matchAll(/<Relationship\b[^>]*>/g) ?? []) {
    const id = m[0].match(/\bId="([^"]+)"/)?.[1];
    const target = m[0].match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target && /TargetMode="External"/.test(m[0])) targets.set(id, decode(target));
  }
  return targets;
}

// A link labelled "LinkedIn" keeps its address: "LinkedIn (https://linkedin.com/in/...)"
function withLinkAddresses(xml: string, targets: Map<string, string>) {
  return xml.replace(/<w:hyperlink\b([^>]*)>([\s\S]*?)<\/w:hyperlink>/g, (whole, attrs: string, inner: string) => {
    const target = targets.get(attrs.match(/r:id="([^"]+)"/)?.[1] ?? "");
    if (!target || target.startsWith("mailto:")) return inner;
    const label = [...inner.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => decode(m[1])).join("");
    if (label.trim() === target || target.endsWith(label.trim())) return inner;
    return `${inner}<w:r><w:t> (${escapeXml(target)})</w:t></w:r>`;
  });
}

function paragraphsToText(xml: string) {
  return (xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) ?? [])
    .map((paragraph) =>
      [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>|<w:cr\/>/g)]
        .map((m) => (m[1] !== undefined ? decode(m[1]) : m[0] === "<w:tab/>" ? "\t" : "\n"))
        .join(""),
    )
    .join("\n");
}

export async function docxToText(data: ArrayBuffer | Uint8Array) {
  const zip = await JSZip.loadAsync(data);
  const main = zip.file("word/document.xml");
  if (!main) throw new Error("Not a Word document");
  // Headers often hold the name and contact details, so read them first
  const headers = zip.file(/^word\/header\d*\.xml$/);
  const targets = await linkTargets(zip);
  const parts = await Promise.all([...headers, main].map((file) => file.async("string")));
  return parts
    .map((xml) => paragraphsToText(withLinkAddresses(xml, targets)))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
