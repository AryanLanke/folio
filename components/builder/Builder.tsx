"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ChatBuilder from "@/components/builder/ChatBuilder";
import CoverLetterEditor from "@/components/builder/CoverLetterEditor";
import Editor from "@/components/builder/Editor";
import ImportDialog from "@/components/builder/ImportDialog";
import AtsView from "@/components/resume/AtsView";
import CoverLetterPreview from "@/components/resume/CoverLetterPreview";
import JobMatch from "@/components/resume/JobMatch";
import PagedPreview from "@/components/resume/PagedPreview";
import ResumePreview from "@/components/resume/ResumePreview";
import Menu, { MenuDivider, MenuLabel, menuItemClass } from "@/components/ui/Menu";
import Segmented from "@/components/ui/Segmented";
import { exportName, saveBlob } from "@/lib/export/text";
import type { ChatTurn } from "@/lib/interview";
import {
  type Library,
  addEntry,
  createLibrary,
  removeEntry,
  renameEntry,
  selectEntry,
  uniqueName,
} from "@/lib/library";
import {
  type JobTarget,
  PAPER,
  type PaperSize,
  type Resume,
  type ResumeStyle,
  TEMPLATES,
  type TemplateName,
  createEmptyResume,
  createSampleResume,
  hasExperience,
  normalizeResume,
} from "@/lib/resume";
import {
  deleteResume,
  loadLibrary,
  loadPaper,
  loadResume,
  saveLibrary,
  savePaper,
  saveResume,
} from "@/lib/storage";

const MAX_UNDO = 20;

const TEMPLATE_OPTIONS = (Object.keys(TEMPLATES) as TemplateName[]).map((value) => ({
  value,
  label: TEMPLATES[value].label,
}));

const FONT_OPTIONS: { value: ResumeStyle["fontSize"]; label: string }[] = [
  { value: "small", label: "S" },
  { value: "medium", label: "M" },
  { value: "large", label: "L" },
];

const SPACING_OPTIONS: { value: ResumeStyle["spacing"]; label: string }[] = [
  { value: "compact", label: "Tight" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Airy" },
];

const PAPER_OPTIONS = (Object.keys(PAPER) as PaperSize[]).map((value) => ({ value, label: PAPER[value].label }));

// "Labels" shows LinkedIn / GitHub as clickable words; "Full" shows the addresses (better for ATS)
const LINK_OPTIONS: { value: ResumeStyle["links"]; label: string }[] = [
  { value: "label", label: "Labels" },
  { value: "url", label: "Full" },
];

type PreviewView = "page" | "ats" | "job";

// "?view=job" or "?view=ats" opens that tab, so links can point straight at a feature
function startingView(): PreviewView {
  const view = new URLSearchParams(window.location.search).get("view");
  return view === "ats" || view === "job" ? view : "page";
}

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

function downloadBackup(resume: Resume) {
  const data = JSON.stringify({ app: "folio", version: 1, resume }, null, 2);
  saveBlob(new Blob([data], { type: "application/json" }), exportName(resume, "resume", "pdf").replace(/\.pdf$/, ".json"));
}

type SaveState = "idle" | "saving" | "saved" | "failed";
type Format = "pdf" | "docx";

const pill = "rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-foreground";

export default function Builder() {
  // Only rendered in the browser (see ClientBuilder), so storage and the URL are readable here
  const [initial] = useState(startingState);
  const [library, setLibrary] = useState<Library>(initial.library);
  const [resume, setResume] = useState<Resume>(initial.resume);
  const [paper, setPaper] = useState<PaperSize>(loadPaper);
  const [history, setHistory] = useState<Resume[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [editorView, setEditorView] = useState<"resume" | "letter">("resume");
  const [previewView, setPreviewView] = useState<PreviewView>(startingView);
  const [importing, setImporting] = useState(false);
  // "?chat" (from the home page) opens the "Tell AI about yourself" chat straight away
  const [chatOpen, setChatOpen] = useState(() => new URLSearchParams(window.location.search).has("chat"));
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeName = library.items.find((item) => item.id === library.activeId)?.name ?? "My resume";

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

  const setStyle = (patch: Partial<ResumeStyle>) => update({ ...resume, style: { ...resume.style, ...patch } });
  const setTarget = (target: JobTarget, checkpoint = false) => update({ ...resume, target }, checkpoint);
  const setLetter = (coverLetter: string, checkpoint = false) => update({ ...resume, coverLetter }, checkpoint);

  const changePaper = (next: PaperSize) => {
    setPaper(next);
    savePaper(next);
  };

  // Autosave shortly after the user stops typing
  useEffect(() => {
    if (saveState !== "saving") return;
    const timer = setTimeout(() => setSaveState(saveResume(library.activeId, resume) ? "saved" : "failed"), 400);
    return () => clearTimeout(timer);
  }, [resume, saveState, library.activeId]);

  // Save right away if the tab is closed before the autosave delay runs out
  useEffect(() => {
    if (saveState !== "saving") return;
    const flush = () => saveResume(library.activeId, resume);
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
    setHistory([]);
    setSaveState("saved");
    setEditorView("resume");
  };

  const switchTo = (id: string) => {
    if (id !== library.activeId) open(selectEntry(library, id), loadResume(id) ?? createEmptyResume());
  };

  const createResume = (content: Resume, name: string) => {
    const { library: next } = addEntry(library, uniqueName(library, name));
    open(next, content);
  };

  const rename = () => {
    const name = prompt("Rename this resume", activeName);
    if (name !== null) setLibrary(renameEntry(library, library.activeId, name));
  };

  const remove = () => {
    if (library.items.length === 1) {
      if (confirm("Clear this resume and start over? You can undo this.")) update(createEmptyResume(), true);
      return;
    }
    if (!confirm(`Delete "${activeName}"? This can't be undone.`)) return;
    deleteResume(library.activeId);
    const next = removeEntry(library, library.activeId);
    setLibrary(next);
    setResume(loadResume(next.activeId) ?? createEmptyResume());
    setHistory([]);
    setSaveState("idle");
  };

  const onImported = (imported: Resume) => {
    setImporting(false);
    setChatOpen(false);
    const blank = !resume.basics.name && !resume.summary && !resume.experience.some(hasExperience);
    const name = imported.basics.name ? `${imported.basics.name.split(" ")[0]}'s resume` : "Imported resume";
    // An empty current resume is simply filled in; otherwise the import becomes a new resume
    if (blank) {
      update(imported, true);
      setLibrary(renameEntry(library, library.activeId, uniqueName({ ...library, items: library.items.filter((i) => i.id !== library.activeId) }, name)));
    } else {
      createResume(imported, name);
    }
  };

  const onBackupChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const restored = normalizeResume(data?.resume ?? data);
      if (!restored) throw new Error("Not a resume");
      createResume(restored, file.name.replace(/\.json$/i, "").replace(/-/g, " ") || "Restored resume");
    } catch {
      alert("That file isn't a Folio backup. Choose the .json file you saved from Folio.");
    }
  };

  // Files are generated in the browser; the export code loads only when first needed
  const download = async (what: "resume" | "letter", format: Format) => {
    setExporting(true);
    try {
      let blob: Blob;
      if (format === "pdf") {
        const pdf = await import("@/lib/export/pdf");
        blob = await (what === "resume" ? pdf.resumePdfBlob(resume, paper) : pdf.coverLetterPdfBlob(resume, paper));
      } else {
        const docx = await import("@/lib/export/docx");
        blob = await docx.toBlob(what === "resume" ? docx.resumeDocx(resume, paper) : docx.coverLetterDocx(resume, paper));
      }
      saveBlob(blob, exportName(resume, what === "resume" ? "resume" : "cover-letter", format));
    } catch {
      alert("Couldn't create the file. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const saveLabel = {
    idle: "",
    saving: "Saving…",
    saved: "Saved in this browser",
    failed: "Couldn't save — your browser is blocking storage",
  }[saveState];

  const resumeIsEmpty = !resume.basics.name && !resume.summary && !resume.experience.some(hasExperience);
  const hasLetter = resume.coverLetter.trim() !== "";

  const layoutControls = (
    <>
      <Segmented label="Template" options={TEMPLATE_OPTIONS} value={resume.style.template} onChange={(template) => setStyle({ template })} />
      <Segmented label="Text" options={FONT_OPTIONS} value={resume.style.fontSize} onChange={(fontSize) => setStyle({ fontSize })} />
      <Segmented label="Spacing" options={SPACING_OPTIONS} value={resume.style.spacing} onChange={(spacing) => setStyle({ spacing })} />
      <Segmented label="Paper" options={PAPER_OPTIONS} value={paper} onChange={changePaper} />
      <Segmented label="Links" options={LINK_OPTIONS} value={resume.style.links} onChange={(links) => setStyle({ links })} />
    </>
  );

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 sm:px-6">
        {/* On narrow phones the resume name shrinks, so the buttons on the right always fit */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
            Folio<span className="text-accent">.</span>
          </Link>

          <Menu
            align="left"
            panelClass="w-72"
            className="min-w-0"
            buttonClass="flex max-w-full items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-surface-hover sm:max-w-[14rem]"
            label={
              <>
                <span className="min-w-0 truncate">{activeName}</span>
                <span className="text-xs text-muted">▾</span>
              </>
            }
          >
            <MenuLabel>Your resumes</MenuLabel>
            {library.items.map((item) => (
              <button key={item.id} type="button" className={menuItemClass} onClick={() => switchTo(item.id)}>
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate">{item.name}</span>
                  {item.id === library.activeId && <span className="text-accent">✓</span>}
                </span>
              </button>
            ))}
            <MenuDivider />
            <button type="button" className={menuItemClass} onClick={() => createResume(createEmptyResume(), "New resume")}>
              + New blank resume
            </button>
            <button type="button" className={menuItemClass} onClick={() => createResume(structuredClone(resume), `${activeName} (copy)`)}>
              Duplicate this resume
              <span className="block text-xs font-normal text-muted">To tailor a copy for another job</span>
            </button>
            <button type="button" className={menuItemClass} onClick={() => setImporting(true)}>
              Import an existing resume…
            </button>
            <button type="button" className={menuItemClass} onClick={() => setChatOpen(true)}>
              Build one by chatting with AI…
            </button>
            <MenuDivider />
            <button type="button" className={menuItemClass} onClick={rename}>
              Rename
            </button>
            <button type="button" className={`${menuItemClass} hover:text-red-400`} onClick={remove}>
              {library.items.length === 1 ? "Clear this resume" : "Delete this resume"}
            </button>
          </Menu>

          <span className={`hidden truncate text-xs lg:inline ${saveState === "failed" ? "text-red-400" : "text-muted"}`}>
            {saveLabel}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {history.length > 0 && (
            <button type="button" onClick={undo} className={pill} aria-label="Undo">
              ↶<span className="hidden sm:inline"> Undo</span>
            </button>
          )}

          <Menu
            label={
              <>
                <span className="sm:hidden" aria-label="More">
                  ⋯
                </span>
                <span className="hidden sm:inline">More</span>
              </>
            }
            buttonClass={pill}
          >
            <button type="button" className={menuItemClass} onClick={() => downloadBackup(resume)}>
              Save backup file
              <span className="block text-xs font-normal text-muted">To move to another device</span>
            </button>
            <button type="button" className={menuItemClass} onClick={() => fileInputRef.current?.click()}>
              Open backup file
            </button>
            <MenuDivider />
            <button
              type="button"
              className={menuItemClass}
              onClick={() => {
                if (confirm("Replace this resume with the example? You can undo this.")) update(createSampleResume(), true);
              }}
            >
              Load example
            </button>
            <a href="https://github.com/AryanLanke/resume-builder/issues/new" target="_blank" rel="noopener noreferrer" className={menuItemClass}>
              Send feedback ↗
            </a>
          </Menu>

          <Menu
            label={exporting ? "Preparing…" : "Download"}
            buttonClass="whitespace-nowrap rounded-full bg-accent px-3 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover sm:px-4"
          >
            <MenuLabel>Resume</MenuLabel>
            <button type="button" className={menuItemClass} disabled={exporting} onClick={() => download("resume", "pdf")}>
              PDF
              <span className="block text-xs font-normal text-muted">Best for applying online</span>
            </button>
            <button type="button" className={menuItemClass} disabled={exporting} onClick={() => download("resume", "docx")}>
              Word (.docx)
              <span className="block text-xs font-normal text-muted">For portals that ask for Word</span>
            </button>
            <MenuDivider />
            <MenuLabel>Cover letter</MenuLabel>
            <button type="button" className={menuItemClass} disabled={exporting || !hasLetter} onClick={() => download("letter", "pdf")}>
              PDF
            </button>
            <button type="button" className={menuItemClass} disabled={exporting || !hasLetter} onClick={() => download("letter", "docx")}>
              Word (.docx)
            </button>
            {!hasLetter && <p className="px-3 pb-2 text-xs text-muted">Write one in the Cover letter tab first.</p>}
          </Menu>
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
              {resumeIsEmpty && (
                <section className="mb-4 rounded-lg border border-accent/40 bg-accent/5 p-4">
                  <p className="text-sm font-bold">Don&apos;t want to fill in forms?</p>
                  <p className="text-sm text-muted">
                    Tell AI about your work in your own words, or import the resume you already have.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setChatOpen(true)}
                      className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
                    >
                      💬 Tell AI about yourself
                    </button>
                    <button
                      type="button"
                      onClick={() => setImporting(true)}
                      className="rounded-full border border-border px-4 py-1.5 text-sm font-bold transition-colors hover:border-foreground"
                    >
                      Import resume
                    </button>
                  </div>
                </section>
              )}
              <Editor resume={resume} onChange={update} />
            </>
          ) : (
            <CoverLetterEditor
              resume={resume}
              onChange={setLetter}
              onOpenJobMatch={() => {
                setPreviewView("job");
                setMobileView("preview");
              }}
            />
          )}
        </div>

        <div
          className={`flex-1 overflow-y-auto bg-[#0b0b0b] p-4 sm:p-8 lg:block ${mobileView === "preview" ? "block" : "hidden"}`}
        >
          <div className="mx-auto mb-4 w-full max-w-[816px]">
            <Segmented
              options={[
                { value: "page", label: editorView === "letter" ? "Letter" : "Page" },
                { value: "ats", label: "ATS check" },
                { value: "job", label: "Job match" },
              ]}
              value={previewView}
              onChange={setPreviewView}
            />
          </div>

          {previewView === "page" && (
            <PagedPreview paper={paper} toolbar={layoutControls}>
              {editorView === "letter" ? (
                <CoverLetterPreview resume={resume} paper={paper} />
              ) : (
                <ResumePreview resume={resume} paper={paper} />
              )}
            </PagedPreview>
          )}
          {previewView === "ats" && (
            <div className="mx-auto w-full max-w-[816px]">
              <AtsView resume={resume} />
            </div>
          )}
          {previewView === "job" && (
            <div className="mx-auto w-full max-w-[816px]">
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

      {importing && <ImportDialog onImported={onImported} onClose={() => setImporting(false)} />}
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
