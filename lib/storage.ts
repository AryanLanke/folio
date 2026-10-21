// Everything Folio keeps in the browser. Storage can be unavailable (private mode,
// blocked site data), so every read and write is wrapped and fails quietly.

import { type PaperSize, type Resume, normalizeResume } from "@/lib/resume";

const RESUME_KEY = "folio:resume";
const PAPER_KEY = "folio:paper";
const PDF_TIP_KEY = "folio:pdf-tip-seen";

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function loadResume(): Resume | null {
  const raw = read(RESUME_KEY);
  if (!raw) return null;
  try {
    return normalizeResume(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveResume(resume: Resume) {
  return write(RESUME_KEY, JSON.stringify(resume));
}

export function loadPaper(): PaperSize {
  return read(PAPER_KEY) === "a4" ? "a4" : "letter";
}

export function savePaper(paper: PaperSize) {
  write(PAPER_KEY, paper);
}

export function hasSeenPdfTip() {
  return read(PDF_TIP_KEY) === "1";
}

export function markPdfTipSeen() {
  write(PDF_TIP_KEY, "1");
}
