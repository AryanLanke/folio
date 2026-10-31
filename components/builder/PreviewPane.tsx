"use client";

import LayoutControls from "@/components/builder/LayoutControls";
import type { useOptimize } from "@/components/builder/useOptimize";
import AtsView from "@/components/resume/AtsView";
import CoverLetterPreview from "@/components/resume/CoverLetterPreview";
import JobMatch from "@/components/resume/JobMatch";
import { OptimizeEffect, OptimizePanel } from "@/components/resume/Optimizer";
import PagedPreview from "@/components/resume/PagedPreview";
import ResumePreview from "@/components/resume/ResumePreview";
import ScoreView from "@/components/resume/ScoreView";
import Segmented from "@/components/ui/Segmented";
import Sparkle from "@/components/ui/Sparkle";
import { changedLines } from "@/lib/optimize";
import { type JobTarget, type PaperSize, type Resume, type ResumeStyle, isBlankResume } from "@/lib/resume";

export type PreviewView = "page" | "score" | "ats" | "job";

// The right side of the editor: the page (or cover letter) with its layout controls, and the
// Score, ATS check and Job match tabs, plus Optimize. On phones it takes turns with the editor.
export default function PreviewPane({
  visible,
  editorView,
  previewView,
  onPreviewView,
  resume,
  paper,
  optimizer,
  onOptimize,
  onStyle,
  onPaper,
  onAccept,
  onTarget,
  onWriteCoverLetter,
}: {
  // On phones, whether it's this side's turn on screen; wider screens always show it
  visible: boolean;
  editorView: "resume" | "letter";
  previewView: PreviewView;
  onPreviewView: (view: PreviewView) => void;
  resume: Resume;
  paper: PaperSize;
  optimizer: ReturnType<typeof useOptimize>;
  onOptimize: () => void;
  onStyle: (patch: Partial<ResumeStyle>) => void;
  onPaper: (paper: PaperSize) => void;
  // A change made on the page or by a one-click fix, saved as its own undo step
  onAccept: (resume: Resume) => void;
  onTarget: (target: JobTarget, checkpoint?: boolean) => void;
  onWriteCoverLetter: () => void;
}) {
  const resumeIsEmpty = isBlankResume(resume);
  const { optimizing, optimized } = optimizer;
  // What Optimize changed stays on show (panel and highlights) until Done or the next edit
  const showOptimized =
    previewView === "page" && editorView === "resume" && optimized !== null && resume === optimized.after;

  return (
    <div
      className={`mobile-view-in flex-1 overflow-y-auto bg-canvas p-4 sm:p-8 lg:block ${visible ? "block" : "hidden"}`}
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
          onChange={onPreviewView}
        />
        {editorView === "resume" && (
          <button
            type="button"
            onClick={onOptimize}
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

      {/* Keyed by resume or letter, so switching between them fades the new one in too */}
      {previewView === "page" && (
        <div key={editorView} className="view-in">
          <PagedPreview
            paper={paper}
            toolbar={
              <LayoutControls
                resume={resume}
                paper={paper}
                showFormat={editorView === "resume"}
                onStyle={onStyle}
                onPaper={onPaper}
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
                    onChange={onAccept}
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
          <ScoreView resume={resume} onChange={onAccept} />
        </div>
      )}
      {previewView === "ats" && (
        <div className="view-in mx-auto w-full max-w-[816px]">
          <AtsView resume={resume} onChange={onAccept} />
        </div>
      )}
      {previewView === "job" && (
        <div className="view-in mx-auto w-full max-w-[816px]">
          <JobMatch
            resume={resume}
            onChange={onTarget}
            onWriteCoverLetter={onWriteCoverLetter}
          />
        </div>
      )}
    </div>
  );
}
