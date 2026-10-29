"use client";

import { useEffect, useState } from "react";
import { type BackupEntry, backupFileName, makeBackup, readBackup } from "@/lib/backup";
import { saveBlob } from "@/lib/export/text";
import { type History, emptyHistory, record, redo, undo } from "@/lib/history";
import {
  type Library,
  type LibraryEntry,
  addEntry,
  createLibrary,
  removeEntry,
  renameEntry,
  selectEntry,
  uniqueName,
} from "@/lib/library";
import { type Resume, createEmptyResume, createSampleResume, isBlankResume } from "@/lib/resume";
import {
  deleteResume,
  keepStorage,
  loadLibrary,
  loadResume,
  markBackedUp,
  markEdited,
  saveLibrary,
  saveResume,
} from "@/lib/storage";

export type SaveState = "idle" | "saving" | "saved" | "failed";

// Saved work always wins; "?example" only fills in a first visit (used by the home page link)
function startingState(): { library: Library; resume: Resume } {
  const saved = loadLibrary();
  if (saved) return { library: saved, resume: loadResume(saved.activeId) ?? createEmptyResume() };
  const example = new URLSearchParams(window.location.search).has("example");
  return {
    library: createLibrary(example ? "Example resume" : "My resume"),
    resume: example ? createSampleResume() : createEmptyResume(),
  };
}

// Every resume this browser keeps, the one that's open, and its undo history. Edits autosave to
// browser storage. onOpen runs whenever a different resume is opened (switched to, created or
// restored from a backup).
export function useResumeLibrary({ onOpen }: { onOpen: () => void }) {
  const [initial] = useState(startingState);
  const [library, setLibrary] = useState<Library>(initial.library);
  const [resume, setResume] = useState<Resume>(initial.resume);
  const [history, setHistory] = useState<History<Resume>>(emptyHistory);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const activeName = library.items.find((item) => item.id === library.activeId)?.name ?? "My resume";

  // Every change is recorded for undo; a burst of typing is one step, and "checkpoint" changes
  // (removing a job, loading the example, accepting an AI suggestion) are always their own step
  const update = (next: Resume, checkpoint = false) => {
    setHistory((h) => record(h, resume, Date.now(), checkpoint));
    setResume(next);
    setSaveState("saving");
  };

  const undoStep = () => {
    const step = undo(history, resume);
    if (!step) return;
    setHistory(step.history);
    setResume(step.value);
    setSaveState("saving");
  };

  const redoStep = () => {
    const step = redo(history, resume);
    if (!step) return;
    setHistory(step.history);
    setResume(step.value);
    setSaveState("saving");
  };

  // Ctrl+Z / Ctrl+Shift+Z (Cmd on Mac) when not typing in a box; inside a box the browser's own undo applies
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable]:not([contenteditable='false'])")) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoStep();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redoStep();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Autosave shortly after the user stops typing. The browser is the only place resumes are
  // kept, so the first save also asks it not to clear them on its own.
  useEffect(() => {
    if (saveState !== "saving") return;
    const timer = setTimeout(() => {
      const saved = saveResume(library.activeId, resume);
      if (saved) {
        markEdited();
        keepStorage();
      }
      setSaveState(saved ? "saved" : "failed");
    }, 400);
    return () => clearTimeout(timer);
  }, [resume, saveState, library.activeId]);

  // Save right away if the tab is closed before the autosave delay runs out
  useEffect(() => {
    if (saveState !== "saving") return;
    const flush = () => saveResume(library.activeId, resume) && markEdited();
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [resume, saveState, library.activeId]);

  // The list of resumes is saved as soon as it changes (first visit, new, rename, delete, switch)
  useEffect(() => {
    saveLibrary(library);
  }, [library]);

  // Switching resumes: save the open one, then load the other with a fresh undo history
  const open = (nextLibrary: Library, nextResume: Resume) => {
    saveResume(library.activeId, resume);
    saveResume(nextLibrary.activeId, nextResume);
    setLibrary(nextLibrary);
    setResume(nextResume);
    setHistory(emptyHistory());
    setSaveState("saved");
    onOpen();
  };

  const switchTo = (id: string) => {
    if (id !== library.activeId) open(selectEntry(library, id), loadResume(id) ?? createEmptyResume());
  };

  const createResume = (content: Resume, name: string) => {
    const { library: next } = addEntry(library, uniqueName(library, name));
    open(next, content);
    markEdited();
  };

  const rename = () => {
    const name = prompt("Rename this resume", activeName);
    if (name !== null) setLibrary(renameEntry(library, library.activeId, name));
  };

  // Empties every field in one go, keeping the look (template, colour, sizes)
  const clear = () => {
    if (confirm("Clear everything on this resume and start over? Your template and colours stay, and you can undo this.")) {
      update({ ...createEmptyResume(), style: resume.style }, true);
    }
  };

  const remove = () => {
    if (!confirm(`Delete "${activeName}"? This can't be undone.`)) return;
    deleteResume(library.activeId);
    const next = removeEntry(library, library.activeId);
    setLibrary(next);
    setResume(loadResume(next.activeId) ?? createEmptyResume());
    setHistory(emptyHistory());
    setSaveState("idle");
  };

  // A resume from Import or Build with AI. An empty current resume is simply filled in;
  // otherwise it becomes a new resume.
  const addImported = (imported: Resume) => {
    const name = imported.basics.name ? `${imported.basics.name.split(" ")[0]}'s resume` : "Imported resume";
    if (isBlankResume(resume)) {
      update(imported, true);
      const others = { ...library, items: library.items.filter((i) => i.id !== library.activeId) };
      setLibrary(renameEntry(library, library.activeId, uniqueName(others, name)));
    } else {
      createResume(imported, name);
    }
  };

  // One file with every resume, so they can all be restored here or on another device
  const saveBackup = () => {
    const entries = library.items.flatMap((item: LibraryEntry): BackupEntry[] => {
      const content = item.id === library.activeId ? resume : loadResume(item.id);
      return content ? [{ name: item.name, resume: content }] : [];
    });
    saveBlob(new Blob([makeBackup(entries)], { type: "application/json" }), backupFileName());
    markBackedUp();
  };

  // Adds every resume in the backup. On a fresh start (one empty resume) that empty one is replaced.
  const restoreBackup = (entries: BackupEntry[]) => {
    saveResume(library.activeId, resume);
    const replaceBlank = library.items.length === 1 && isBlankResume(resume);
    let next = library;
    const ids: string[] = [];
    for (const entry of entries) {
      const added = addEntry(next, uniqueName(next, entry.name));
      saveResume(added.id, entry.resume);
      ids.push(added.id);
      next = added.library;
    }
    if (replaceBlank) {
      deleteResume(library.activeId);
      next = removeEntry(next, library.activeId);
    }
    setLibrary(selectEntry(next, ids[0]));
    setResume(entries[0].resume);
    setHistory(emptyHistory());
    setSaveState("saved");
    onOpen();
    alert(entries.length === 1 ? "Restored 1 resume." : `Restored ${entries.length} resumes. Switch between them from the menu at the top left.`);
  };

  const openBackup = async (file: File) => {
    const text = await file.text().catch(() => "");
    const entries = readBackup(text, file.name.replace(/\.json$/i, "").replace(/-/g, " ") || "Restored resume");
    if (entries) restoreBackup(entries);
    else alert("That file isn't a Folio backup. Choose the .json file you saved from Folio.");
  };

  return {
    library,
    activeName,
    resume,
    history,
    saveState,
    update,
    undo: undoStep,
    redo: redoStep,
    switchTo,
    createResume,
    rename,
    clear,
    remove,
    addImported,
    saveBackup,
    openBackup,
  };
}
