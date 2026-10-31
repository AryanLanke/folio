"use client";

import Link from "next/link";
import DownloadMenu from "@/components/builder/header/DownloadMenu";
import MoreMenu from "@/components/builder/header/MoreMenu";
import ResumeMenu from "@/components/builder/header/ResumeMenu";
import type { useResumeLibrary } from "@/components/builder/useResumeLibrary";
import { type PaperSize, createEmptyResume, createSampleResume } from "@/lib/resume";

const pill = "rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-foreground";
const iconButton =
  "flex size-9 items-center justify-center rounded-full text-lg text-muted transition-colors hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-30";

const SAVE_LABELS = {
  idle: "",
  saving: "Saving…",
  saved: "Saved in this browser only",
  failed: "Couldn't save — your browser is blocking storage",
};

// Whether the resume saved, in red when the browser won't let it
export function SaveStatus({ state, className }: { state: keyof typeof SAVE_LABELS; className: string }) {
  return (
    <span className={`text-xs ${state === "failed" ? "text-danger" : "text-muted"} ${className}`}>{SAVE_LABELS[state]}</span>
  );
}

// The bar along the top of the editor: home, your resumes, whether it saved, undo and redo, More
// and Download
export default function BuilderHeader({
  docs,
  paper,
  onImport,
  onChat,
  onSaveBackup,
  onOpenBackup,
  onDownloaded,
}: {
  docs: ReturnType<typeof useResumeLibrary>;
  paper: PaperSize;
  onImport: () => void;
  onChat: () => void;
  onSaveBackup: () => void;
  onOpenBackup: () => void;
  onDownloaded: () => void;
}) {
  const { resume, update } = docs;
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 sm:px-6">
      {/* On narrow phones the resume name shrinks, so the buttons on the right always fit */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
          Folio<span className="text-accent-ink">.</span>
        </Link>

        <ResumeMenu
          library={docs.library}
          activeName={docs.activeName}
          onSwitch={docs.switchTo}
          onNew={() => docs.createResume(createEmptyResume(), "New resume")}
          onDuplicate={() => docs.createResume(structuredClone(resume), `${docs.activeName} (copy)`)}
          onImport={onImport}
          onChat={onChat}
          onRename={docs.rename}
          onClear={docs.clear}
          onDelete={docs.remove}
        />

        <SaveStatus state={docs.saveState} className="hidden truncate lg:inline" />
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="flex">
          <button
            type="button"
            onClick={docs.undo}
            disabled={docs.history.past.length === 0}
            className={iconButton}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={docs.redo}
            disabled={docs.history.future.length === 0}
            className={iconButton}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷
          </button>
        </div>

        <MoreMenu
          resumeCount={docs.library.items.length}
          buttonClass={pill}
          onSaveBackup={onSaveBackup}
          onOpenBackup={onOpenBackup}
          onLoadExample={() => {
            if (confirm("Replace this resume with the example? You can undo this.")) update(createSampleResume(), true);
          }}
        />

        <DownloadMenu resume={resume} paper={paper} onDownloaded={onDownloaded} />
      </div>
    </header>
  );
}
