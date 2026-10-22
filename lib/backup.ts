// Backup files: Folio keeps resumes only in the browser, so a backup file is the person's own
// copy outside it. One file holds every resume, so moving to another device is one step.

import { type Resume, normalizeResume } from "@/lib/resume";

export type BackupEntry = { name: string; resume: Resume };

export function makeBackup(entries: BackupEntry[]) {
  return JSON.stringify({ app: "folio", version: 2, resumes: entries }, null, 2);
}

export function backupFileName(now = new Date()) {
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `folio-backup-${day}.json`;
}

// Reads every resume in a backup file. Also accepts older files that held one resume
// ({"resume": ...}) or a bare resume. Returns null when nothing in it is a resume.
export function readBackup(text: string, fallbackName: string): BackupEntry[] | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const src = data as Record<string, unknown>;

  if (Array.isArray(src.resumes)) {
    const entries = src.resumes.flatMap((item): BackupEntry[] => {
      if (!item || typeof item !== "object") return [];
      const { name, resume } = item as Record<string, unknown>;
      const restored = normalizeResume(resume);
      if (!restored) return [];
      return [{ name: typeof name === "string" && name.trim() ? name.trim() : fallbackName, resume: restored }];
    });
    return entries.length > 0 ? entries : null;
  }

  const resume = normalizeResume(src.resume ?? src);
  return resume ? [{ name: fallbackName, resume }] : null;
}

// True when there are edits a backup doesn't have yet (both are times in milliseconds, 0 if never)
export function backupIsBehind(editedAt: number, backedUpAt: number) {
  return editedAt > backedUpAt;
}
