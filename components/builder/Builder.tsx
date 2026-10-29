"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import BackupNudge from "@/components/builder/BackupNudge";
import ChatBuilder from "@/components/builder/ChatBuilder";
import CoverLetterEditor from "@/components/builder/CoverLetterEditor";
import Editor from "@/components/builder/Editor";
import DownloadMenu from "@/components/builder/header/DownloadMenu";
import MoreMenu from "@/components/builder/header/MoreMenu";
import ResumeMenu from "@/components/builder/header/ResumeMenu";
import ImportDialog from "@/components/builder/ImportDialog";
import LayoutControls from "@/components/builder/LayoutControls";
import StartOptions from "@/components/builder/StartOptions";
import { useOptimize } from "@/components/builder/useOptimize";
import { useResumeLibrary } from "@/components/builder/useResumeLibrary";
import AtsView from "@/components/resume/AtsView";
import CoverLetterPreview from "@/components/resume/CoverLetterPreview";
import JobMatch from "@/components/resume/JobMatch";
import { OptimizeEffect, OptimizePanel } from "@/components/resume/Optimizer";
import PagedPreview from "@/components/resume/PagedPreview";
import ResumePreview from "@/components/resume/ResumePreview";
import ScoreView from "@/components/resume/ScoreView";
import Segmented from "@/components/ui/Segmented";
import Sparkle from "@/components/ui/Sparkle";
import type { ChatTurn } from "@/lib/interview";
import { changedLines } from "@/lib/optimize";
import {
  type JobTarget,
  type PaperSize,
  type Resume,
  type ResumeStyle,
  createEmptyResume,
  createSampleResume,
  isBlankResume,
} from "@/lib/resume";
import { loadPaper, needsBackup, savePaper } from "@/lib/storage";

type PreviewView = "page" | "score" | "ats" | "job";

// "?view=job" (or score, ats) opens that tab, so links can point straight at a feature.
// "?score" comes from the home page's "Score my resume": import a resume, then see its score.
function startingView(): PreviewView {
  const params = new URLSearchParams(window.location.search);
  if (params.has("score")) return "score";
  const view = params.get("view");
  return view === "score" || view === "ats" || view === "job" ? view : "page";
}

const pill = "rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-foreground";
const iconButton =
  "flex size-9 items-center justify-center rounded-full text-lg text-muted transition-colors hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-30";

const SAVE_LABELS = {
  idle: "",
  saving: "Saving…",
  saved: "Saved in this browser only",
  failed: "Couldn't save — your browser is blocking storage",
};

// The editor page: the form (or cover letter) on the left, the page and its checks on the right.
// Only rendered in the browser (see ClientBuilder), so storage and the URL are readable here.
export default function Builder() {
  const [editorView, setEditorView] = useState<"resume" | "letter">("resume");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [previewView, setPreviewView] = useState<PreviewView>(startingView);
  const docs = useResumeLibrary({ onOpen: () => setEditorView("resume") });
  const { resume, update } = docs;
  const [paper, setPaper] = useState<PaperSize>(loadPaper);
  const optimizer = useOptimize({ resume, paper, update });
  const [importing, setImporting] = useState(() => new URLSearchParams(window.location.search).has("score"));
  // "?chat" (from the home page) opens the "Build with AI" chat straight away
  const [chatOpen, setChatOpen] = useState(() => new URLSearchParams(window.location.search).has("chat"));
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  // "Keep a backup" reminder after a download; "Not now" hides it until the page is reloaded
  const [backupNudge, setBackupNudge] = useState(false);
  const nudgeDismissed = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setStyle = (patch: Partial<ResumeStyle>) => update({ ...resume, style: { ...resume.style, ...patch } });
  const setTarget = (target: JobTarget, checkpoint = false) => update({ ...resume, target }, checkpoint);
  const setLetter = (coverLetter: string, checkpoint = false) => update({ ...resume, coverLetter }, checkpoint);
  const acceptChange = (next: Resume) => update(next, true);

  const showPreview = (view: PreviewView) => {
    setPreviewView(view);
    setMobileView("preview");
  };

  // Optimize happens on the page, so it switches there first
  const optimize = () => {
    showPreview("page");
    optimizer.optimize();
  };

  const changePaper = (next: PaperSize) => {
    setPaper(next);
    savePaper(next);
  };

  const onImported = (imported: Resume) => {
    setImporting(false);
    setChatOpen(false);
    docs.addImported(imported);
  };

  const saveBackup = () => {
    docs.saveBackup();
    setBackupNudge(false);
  };

  // Downloading is when real work is done, so it's the moment to suggest keeping a backup
  const onDownloaded = () => {
    if (!nudgeDismissed.current && needsBackup()) setBackupNudge(true);
  };

  const onBackupChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) docs.openBackup(file);
  };

  const resumeIsEmpty = isBlankResume(resume);
  const { optimizing, optimized } = optimizer;
  // What Optimize changed stays on show (panel and highlights) until Done or the next edit
  const showOptimized =
    previewView === "page" && editorView === "resume" && optimized !== null && resume === optimized.after;

  return (
    <div className="flex h-dvh flex-col">
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
            onImport={() => setImporting(true)}
            onChat={() => setChatOpen(true)}
            onRename={docs.rename}
            onClear={docs.clear}
            onDelete={docs.remove}
          />

          <span className={`hidden truncate text-xs lg:inline ${docs.saveState === "failed" ? "text-danger" : "text-muted"}`}>
            {SAVE_LABELS[docs.saveState]}
          </span>
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
            onSaveBackup={saveBackup}
            onOpenBackup={() => fileInputRef.current?.click()}
            onLoadExample={() => {
              if (confirm("Replace this resume with the example? You can undo this.")) update(createSampleResume(), true);
            }}
          />

          <DownloadMenu resume={resume} paper={paper} onDownloaded={onDownloaded} />
        </div>
      </header>

      <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={onBackupChosen} />

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
          <div className="mb-4">
            <Segmented
              options={[
                { value: "resume", label: "Resume" },
                { value: "letter", label: "Cover letter" },
              ]}
              value={editorView}
              onChange={setEditorView}
            />
          </div>

          {editorView === "resume" ? (
            <>
              <StartOptions
                blank={resumeIsEmpty}
                onChat={() => setChatOpen(true)}
                onImport={() => setImporting(true)}
                onOpenBackup={() => fileInputRef.current?.click()}
                onClear={docs.clear}
              />
              <Editor resume={resume} onChange={update} />
            </>
          ) : (
            <CoverLetterEditor resume={resume} onChange={setLetter} onOpenJobMatch={() => showPreview("job")} />
          )}
        </div>

        <div
          className={`flex-1 overflow-y-auto bg-canvas p-4 sm:p-8 lg:block ${mobileView === "preview" ? "block" : "hidden"}`}
        >
          <div className="mx-auto mb-4 flex w-full max-w-[816px] flex-wrap items-center justify-between gap-2">
            <Segmented
              options={[
                { value: "page", label: editorView === "letter" ? "Letter" : "Page" },
                { value: "score", label: "Score" },
                { value: "ats", label: "ATS check" },
                { value: "job", label: "Job match" },
              ]}
              value={previewView}
              onChange={setPreviewView}
            />
            {editorView === "resume" && (
              <button
                type="button"
                onClick={optimize}
                disabled={optimizing !== null || resumeIsEmpty}
                title="Fixes formatting, rewords weak lines without adding facts, and fits the layout to the page. Uses 1 AI action."
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
              >
                <Sparkle className={optimizing === "working" ? "animate-pulse" : ""} />
                {optimizing === "working" ? "Optimizing…" : "Optimize"}
              </button>
            )}
          </div>

          {showOptimized && (
            <div className="mx-auto w-full max-w-[816px]">
              <OptimizePanel
                optimized={optimized}
                onRevert={optimizer.revert}
                onUndoAll={optimizer.undoAll}
                onClose={optimizer.close}
              />
            </div>
          )}

          {previewView === "page" && (
            <div className="view-in">
              <PagedPreview
                paper={paper}
                toolbar={
                  <LayoutControls
                    resume={resume}
                    paper={paper}
                    showFormat={editorView === "resume"}
                    onStyle={setStyle}
                    onPaper={changePaper}
                  />
                }
              >
                {editorView === "letter" ? (
                  <CoverLetterPreview resume={resume} paper={paper} />
                ) : (
                  <>
                    <div className="optimize-target" data-working={optimizing === "working" || undefined}>
                      <ResumePreview
                        resume={resume}
                        paper={paper}
                        onChange={acceptChange}
                        changed={showOptimized ? changedLines(optimized.changes) : undefined}
                      />
                    </div>
                    {optimizing && <OptimizeEffect phase={optimizing} />}
                  </>
                )}
              </PagedPreview>
            </div>
          )}
          {previewView === "score" && (
            <div className="view-in mx-auto w-full max-w-[816px]">
              <ScoreView resume={resume} onChange={acceptChange} />
            </div>
          )}
          {previewView === "ats" && (
            <div className="view-in mx-auto w-full max-w-[816px]">
              <AtsView resume={resume} onChange={acceptChange} />
            </div>
          )}
          {previewView === "job" && (
            <div className="view-in mx-auto w-full max-w-[816px]">
              <JobMatch
                resume={resume}
                onChange={setTarget}
                onWriteCoverLetter={() => {
                  setEditorView("letter");
                  setMobileView("edit");
                }}
              />
            </div>
          )}
        </div>
      </div>

      {backupNudge && (
        <BackupNudge
          onSave={saveBackup}
          onDismiss={() => {
            nudgeDismissed.current = true;
            setBackupNudge(false);
          }}
        />
      )}

      {importing && (
        <ImportDialog
          onImported={(imported) => {
            onImported(imported);
            // Show how the imported resume scores straight away
            showPreview("score");
          }}
          onClose={() => setImporting(false)}
        />
      )}
      {chatOpen && (
        <ChatBuilder
          turns={chatTurns}
          onTurnsChange={setChatTurns}
          onCreated={(created) => {
            setChatTurns([]);
            onImported(created);
          }}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
