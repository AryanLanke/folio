"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Editor from "@/components/builder/Editor";
import PagedPreview from "@/components/resume/PagedPreview";
import ResumePreview from "@/components/resume/ResumePreview";
import {
  PAGE_MARGIN,
  PAPER,
  type PaperSize,
  type Resume,
  createEmptyResume,
  createSampleResume,
  normalizeResume,
} from "@/lib/resume";

const STORAGE_KEY = "folio:resume";
const PAPER_KEY = "folio:paper";
const MAX_UNDO = 20;

// Storage can be unavailable (private mode, blocked site data), so never let it crash the editor
function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function loadResume(): Resume | null {
  const raw = readStorage(STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeResume(JSON.parse(raw));
  } catch {
    return null;
  }
}

function loadPaper(): PaperSize {
  return readStorage(PAPER_KEY) === "a4" ? "a4" : "letter";
}

function fileName(resume: Resume, extension: string) {
  const name = resume.basics.name.trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-");
  return `${name || "resume"}-folio.${extension}`;
}

function downloadBackup(resume: Resume) {
  const data = JSON.stringify({ app: "folio", version: 1, resume }, null, 2);
  const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName(resume, "json");
  link.click();
  URL.revokeObjectURL(url);
}

type SaveState = "idle" | "saving" | "saved" | "failed";

const menuItem =
  "block w-full rounded px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover";

export default function Builder() {
  // Only rendered in the browser (see ClientBuilder), so storage is readable here
  const [resume, setResume] = useState<Resume>(() => loadResume() ?? createEmptyResume());
  const [paper, setPaper] = useState<PaperSize>(loadPaper);
  const [history, setHistory] = useState<Resume[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const menuRef = useRef<HTMLDetailsElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (next: Resume, checkpoint = false) => {
    if (checkpoint) setHistory((h) => [...h.slice(-(MAX_UNDO - 1)), resume]);
    setResume(next);
    setSaveState("saving");
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((h) => h.slice(0, -1));
    setResume(previous);
    setSaveState("saving");
  };

  const changePaper = (next: PaperSize) => {
    setPaper(next);
    writeStorage(PAPER_KEY, next);
  };

  // Autosave shortly after the user stops typing
  useEffect(() => {
    if (saveState !== "saving") return;
    const timer = setTimeout(
      () => setSaveState(writeStorage(STORAGE_KEY, JSON.stringify(resume)) ? "saved" : "failed"),
      400,
    );
    return () => clearTimeout(timer);
  }, [resume, saveState]);

  // Close the "More" menu when clicking anywhere else
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const menu = menuRef.current;
      if (menu?.open && !menu.contains(e.target as Node)) menu.open = false;
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const closeMenu = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  const loadExample = () => {
    closeMenu();
    if (confirm("Replace your current resume with the example? You can undo this.")) {
      update(createSampleResume(), true);
    }
  };

  const clearAll = () => {
    closeMenu();
    if (confirm("Clear everything and start over? You can undo this.")) {
      update(createEmptyResume(), true);
    }
  };

  const saveBackup = () => {
    closeMenu();
    downloadBackup(resume);
  };

  const openBackup = () => {
    closeMenu();
    fileInputRef.current?.click();
  };

  const onBackupChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const restored = normalizeResume(data?.resume ?? data);
      if (!restored) throw new Error("Not a resume");
      update(restored, true);
    } catch {
      alert("That file isn't a Folio backup. Choose the .json file you saved from Folio.");
    }
  };

  // The browser's print dialog saves a real text PDF, so links stay clickable and ATS can read it
  const downloadPdf = () => {
    const previousTitle = document.title;
    document.title = fileName(resume, "pdf").replace(/\.pdf$/, "");
    window.print();
    document.title = previousTitle;
  };

  const saveLabel = {
    idle: "",
    saving: "Saving…",
    saved: "Saved in this browser",
    failed: "Couldn't save — your browser is blocking storage",
  }[saveState];

  const paperToggle = (
    <div className="flex rounded-full bg-surface p-0.5">
      {(Object.keys(PAPER) as PaperSize[]).map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => changePaper(size)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
            paper === size ? "bg-foreground text-background" : "text-muted hover:text-foreground"
          }`}
        >
          {PAPER[size].label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Page size and margins for the downloaded PDF */}
      <style>{`@page { size: ${PAPER[paper].css}; margin: ${PAGE_MARGIN}px; }`}</style>

      <div className="flex h-dvh flex-col print:hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Folio<span className="text-accent">.</span>
            </Link>
            <span
              className={`hidden truncate text-xs md:inline ${saveState === "failed" ? "text-red-400" : "text-muted"}`}
            >
              {saveLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={undo}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-foreground"
              >
                ↶ Undo
              </button>
            )}

            <details ref={menuRef} className="relative">
              <summary className="cursor-pointer list-none rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                More
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-border bg-surface p-1.5 shadow-2xl">
                <button type="button" className={menuItem} onClick={saveBackup}>
                  Save backup file
                  <span className="block text-xs font-normal text-muted">To move to another device</span>
                </button>
                <button type="button" className={menuItem} onClick={openBackup}>
                  Open backup file
                </button>
                <div className="my-1 border-t border-border" />
                <button type="button" className={menuItem} onClick={loadExample}>
                  Load example
                </button>
                <button type="button" className={`${menuItem} hover:text-red-400`} onClick={clearAll}>
                  Clear everything
                </button>
              </div>
            </details>

            <button
              type="button"
              onClick={downloadPdf}
              className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
            >
              Download PDF
            </button>
          </div>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onBackupChosen}
        />

        <div className="flex shrink-0 gap-1 border-b border-border p-2 lg:hidden">
          {(["edit", "preview"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setMobileView(view)}
              className={`flex-1 rounded-full py-2 text-sm font-bold capitalize transition-colors ${
                mobileView === view ? "bg-foreground text-background" : "text-muted"
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1">
          <div
            className={`w-full overflow-y-auto p-4 sm:p-6 lg:block lg:w-[46%] lg:max-w-[640px] lg:border-r lg:border-border ${
              mobileView === "edit" ? "block" : "hidden"
            }`}
          >
            <Editor resume={resume} onChange={update} />
          </div>
          <div
            className={`flex-1 overflow-y-auto bg-[#0b0b0b] p-4 sm:p-8 lg:block ${
              mobileView === "preview" ? "block" : "hidden"
            }`}
          >
            <PagedPreview resume={resume} paper={paper} toolbar={paperToggle} />
          </div>
        </div>
      </div>

      {/* Only this copy is printed, without the editor around it */}
      <div className="hidden print:block">
        <ResumePreview resume={resume} paper={paper} mode="print" />
      </div>
    </>
  );
}
