"use client";

import { useRef, useState } from "react";
import BackupNudge from "@/components/builder/BackupNudge";
import ChatBuilder from "@/components/builder/ChatBuilder";
import CoverLetterEditor from "@/components/builder/CoverLetterEditor";
import Editor from "@/components/builder/Editor";
import BuilderHeader, { SaveStatus } from "@/components/builder/header/BuilderHeader";
import ImportDialog from "@/components/builder/ImportDialog";
import PreviewPane, { type PreviewView } from "@/components/builder/PreviewPane";
import StartOptions from "@/components/builder/StartOptions";
import { useOptimize } from "@/components/builder/useOptimize";
import { useResumeLibrary } from "@/components/builder/useResumeLibrary";
import Segmented from "@/components/ui/Segmented";
import type { ChatTurn } from "@/lib/interview";
import {
  type JobTarget,
  type PaperSize,
  type Resume,
  type ResumeStyle,
  isBlankResume,
} from "@/lib/resume";
import { loadPaper, needsBackup, savePaper } from "@/lib/storage";

// "?view=job" (or score, ats) opens that tab, so links can point straight at a feature.
// "?score" comes from the home page's "Score my resume": import a resume, then see its score.
function startingView(): PreviewView {
  const params = new URLSearchParams(window.location.search);
  if (params.has("score")) return "score";
  const view = params.get("view");
  return view === "score" || view === "ats" || view === "job" ? view : "page";
}

// The editor page: the form (or cover letter) on the left, the page and its checks on the right.
// Only rendered in the browser (see ClientBuilder), so storage and the URL are readable here.
export default function Builder() {
  const [editorView, setEditorView] = useState<"resume" | "letter">("resume");
  const [previewView, setPreviewView] = useState<PreviewView>(startingView);
  // On a phone only one half shows at a time: a link to a tab (Score, ATS check, Job match) opens
  // on that tab, not on the editor
  const [mobileView, setMobileView] = useState<"edit" | "preview">(previewView === "page" ? "edit" : "preview");
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

  return (
    <div className="flex h-dvh flex-col">
      <BuilderHeader
        docs={docs}
        paper={paper}
        onImport={() => setImporting(true)}
        onChat={() => setChatOpen(true)}
        onSaveBackup={saveBackup}
        onOpenBackup={() => fileInputRef.current?.click()}
        onDownloaded={onDownloaded}
      />

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
          className={`mobile-view-in w-full overflow-y-auto p-4 sm:p-6 lg:block lg:w-[46%] lg:max-w-[640px] lg:border-r lg:border-border ${
            mobileView === "edit" ? "block" : "hidden"
          }`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <Segmented
              options={[
                { value: "resume", label: "Resume" },
                { value: "letter", label: "Cover letter" },
              ]}
              value={editorView}
              onChange={setEditorView}
            />
            {/* Phones have no room in the header, so whether it saved shows here instead */}
            <SaveStatus state={docs.saveState} className="min-w-0 truncate text-right lg:hidden" />
          </div>

          {editorView === "resume" ? (
            <div key="resume" className="view-in">
              <StartOptions
                blank={resumeIsEmpty}
                onChat={() => setChatOpen(true)}
                onImport={() => setImporting(true)}
                onOpenBackup={() => fileInputRef.current?.click()}
                onClear={docs.clear}
              />
              <Editor resume={resume} onChange={update} />
            </div>
          ) : (
            <div key="letter" className="view-in">
              <CoverLetterEditor resume={resume} onChange={setLetter} onOpenJobMatch={() => showPreview("job")} />
            </div>
          )}
        </div>

        <PreviewPane
          visible={mobileView === "preview"}
          editorView={editorView}
          previewView={previewView}
          onPreviewView={setPreviewView}
          resume={resume}
          paper={paper}
          optimizer={optimizer}
          onOptimize={optimize}
          onStyle={setStyle}
          onPaper={changePaper}
          onAccept={acceptChange}
          onTarget={setTarget}
          onWriteCoverLetter={() => {
            setEditorView("letter");
            setMobileView("edit");
          }}
        />
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
