import { describe, expect, it } from "vitest";
import { backupFileName, backupIsBehind, makeBackup, readBackup } from "@/lib/backup";
import { createEmptyResume, createSampleResume } from "@/lib/resume";

describe("backup files", () => {
  it("keeps every resume and its name", () => {
    const sample = createSampleResume();
    const file = makeBackup([
      { name: "Frontend", resume: sample },
      { name: "Data", resume: createEmptyResume() },
    ]);
    const restored = readBackup(file, "Restored resume");
    expect(restored?.map((entry) => entry.name)).toEqual(["Frontend", "Data"]);
    expect(restored?.[0].resume).toEqual(sample);
  });

  it("reads older single-resume backups and bare resumes", () => {
    const sample = createSampleResume();
    expect(readBackup(JSON.stringify({ app: "folio", version: 1, resume: sample }), "Old")).toEqual([
      { name: "Old", resume: sample },
    ]);
    expect(readBackup(JSON.stringify(sample), "Bare")?.[0].name).toBe("Bare");
  });

  it("skips broken entries and rejects files with no resume", () => {
    const file = JSON.stringify({ resumes: [{ name: "Bad", resume: { nope: true } }, { resume: createEmptyResume() }] });
    expect(readBackup(file, "Restored")?.map((entry) => entry.name)).toEqual(["Restored"]);
    expect(readBackup(JSON.stringify({ resumes: [] }), "x")).toBeNull();
    expect(readBackup('{"hello": "world"}', "x")).toBeNull();
    expect(readBackup("not json", "x")).toBeNull();
  });

  it("names the file by date", () => {
    expect(backupFileName(new Date(2026, 9, 5))).toBe("folio-backup-2026-10-05.json");
  });

  it("knows when a backup is missing recent edits", () => {
    expect(backupIsBehind(0, 0)).toBe(false);
    expect(backupIsBehind(2000, 0)).toBe(true);
    expect(backupIsBehind(2000, 3000)).toBe(false);
  });
});
