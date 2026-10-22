// Everything Folio keeps in the browser. Storage can be unavailable (private mode,
// blocked site data), so every read and write is wrapped and fails quietly.

import { backupIsBehind } from "@/lib/backup";
import { recordUse, usesLeft } from "@/lib/enhance";
import { type Library, createLibrary, normalizeLibrary } from "@/lib/library";
import { type PaperSize, type Resume, normalizeResume } from "@/lib/resume";

const LIBRARY_KEY = "folio:library";
const RESUME_PREFIX = "folio:resume:";
// Where the single resume lived before multiple resumes existed
const LEGACY_RESUME_KEY = "folio:resume";
const PAPER_KEY = "folio:paper";
const AI_USES_KEY = "folio:ai-uses";
// When resumes last changed and when a backup file was last saved, to know if it's out of date
const EDITED_KEY = "folio:edited-at";
const BACKED_UP_KEY = "folio:backed-up-at";

// The user's own calendar day, so the allowance resets at their midnight
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

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

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to do; the entry just stays behind
  }
}

function parse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadResume(id: string): Resume | null {
  return normalizeResume(parse(read(RESUME_PREFIX + id)));
}

export function saveResume(id: string, resume: Resume) {
  return write(RESUME_PREFIX + id, JSON.stringify(resume));
}

export function deleteResume(id: string) {
  remove(RESUME_PREFIX + id);
}

export function saveLibrary(library: Library) {
  return write(LIBRARY_KEY, JSON.stringify(library));
}

// Loads the list of resumes. On a first visit after the multiple-resume update, the old
// single resume becomes the first entry. Returns null when nothing was ever saved.
export function loadLibrary(): Library | null {
  const library = normalizeLibrary(parse(read(LIBRARY_KEY)));
  if (library) return library;

  const legacy = normalizeResume(parse(read(LEGACY_RESUME_KEY)));
  if (!legacy) return null;
  const migrated = createLibrary("My resume");
  if (saveResume(migrated.activeId, legacy) && saveLibrary(migrated)) remove(LEGACY_RESUME_KEY);
  return migrated;
}

export function loadPaper(): PaperSize {
  return read(PAPER_KEY) === "a4" ? "a4" : "letter";
}

export function savePaper(paper: PaperSize) {
  write(PAPER_KEY, paper);
}

const readTime = (key: string) => Number(read(key)) || 0;

export function markEdited() {
  write(EDITED_KEY, String(Date.now()));
}

export function markBackedUp() {
  write(BACKED_UP_KEY, String(Date.now()));
}

export function needsBackup() {
  return backupIsBehind(readTime(EDITED_KEY), readTime(BACKED_UP_KEY));
}

let persistRequested = false;

// Asks the browser not to clear Folio's storage on its own (to free up space, for example).
// Browsers decide whether to agree, and Safari may still clear sites that aren't visited for
// a while, so this helps but doesn't replace a backup file.
export function keepStorage() {
  if (persistRequested) return;
  persistRequested = true;
  try {
    const storage = navigator.storage;
    if (!storage?.persist) return;
    storage
      .persisted()
      .then((already) => already || storage.persist())
      .catch(() => {});
  } catch {
    // Not supported here; nothing to do
  }
}

export function aiUsesLeft() {
  return usesLeft(read(AI_USES_KEY), today());
}

export function recordAiUse() {
  write(AI_USES_KEY, recordUse(read(AI_USES_KEY), today()));
}
