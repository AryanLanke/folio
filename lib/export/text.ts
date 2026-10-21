// Text helpers shared by the PDF and Word exports

import type { Resume } from "@/lib/resume";

// The PDF uses the standard Helvetica and Times fonts, which only cover Western European
// characters. Swap common symbols outside that set for plain equivalents.
export function pdfSafe(text: string) {
  return text
    .replace(/₹/g, "Rs. ")
    .replace(/[‐‑‒−]/g, "-")
    .replace(/[   ]/g, " ")
    .replace(/[→➔➤]/g, "->")
    .replace(/[✓✔✅]/g, "")
    .replace(/[▪●◦‣⁃]/g, "•");
}

export function webHref(text: string) {
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}

export function exportName(resume: Resume, kind: "resume" | "cover-letter", extension: "pdf" | "docx") {
  const name = resume.basics.name.trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-");
  return `${name || "folio"}-${kind}.${extension}`;
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
