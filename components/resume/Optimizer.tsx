"use client";

import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import ResumePreview from "@/components/resume/ResumePreview";
import Sparkle from "@/components/ui/Sparkle";
import { atsChecks, atsScore, fixBulletFormatting } from "@/lib/ats";
import { callAi } from "@/lib/client/ai";
import {
  type OptimizeChange,
  type OptimizeResult,
  applyOptimize,
  bestLayout,
  layoutCandidates,
  listChanges,
  optimizeRequest,
} from "@/lib/optimize";
import { countPages } from "@/lib/pages";
import { PAGE_MARGIN, PAPER, type PaperSize, type Resume, type ResumeStyle } from "@/lib/resume";

export type Optimized = {
  before: Resume;
  after: Resume;
  changes: OptimizeChange[];
  // ATS score before and after
  scores: [number, number];
  // Why the wording couldn't be rewritten, when AI wasn't available
  note: string | null;
};

// How long the final sweep that uncovers the result takes (matches globals.css)
export const REVEAL_MS = 900;
// The effect always runs at least this long, so a quick answer still reads as one smooth pass
const MIN_EFFECT_MS = 1600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const score = (resume: Resume) => atsScore(atsChecks(resume));

// Draws the resume off screen and measures it, the same way the preview does
function measureHeight(resume: Resume, paper: PaperSize) {
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${PAPER[paper].width}px;visibility:hidden;pointer-events:none`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(<ResumePreview resume={resume} paper={paper} />));
    return host.offsetHeight;
  } finally {
    root.unmount();
    host.remove();
  }
}

function fitLayout(resume: Resume, paper: PaperSize): ResumeStyle {
  const candidates = layoutCandidates(resume.style);
  const pages = candidates.map((style) =>
    countPages(measureHeight({ ...resume, style }, paper), PAPER[paper].height, PAGE_MARGIN),
  );
  return bestLayout(resume.style, candidates, pages);
}

// Formatting fixes, then the wording (one AI request, so one of the day's free AI actions),
// then the layout that fits best. When AI can't help, the rest still happens.
export async function optimizeResume(resume: Resume, paper: PaperSize): Promise<Optimized> {
  const started = Date.now();
  let next = fixBulletFormatting(resume);
  let note: string | null = null;

  const request = optimizeRequest(next);
  if (request.summary || request.items.length > 0) {
    const reply = await callAi<OptimizeResult>("/api/optimize", request);
    if (reply.ok) next = applyOptimize(next, reply.data);
    else note = `${reply.message} The wording wasn't changed; formatting and layout were still optimized.`;
  }
  next = { ...next, style: fitLayout(next, paper) };

  await wait(Math.max(0, MIN_EFFECT_MS - (Date.now() - started)));
  const changes = listChanges(resume, next);
  return { before: resume, after: changes.length > 0 ? next : resume, changes, scores: [score(resume), score(next)], note };
}

// Over the page while Optimize works: a band of light with a fine shimmer sweeps down it, the way
// a photo app shows it retouching a picture. Then one last sweep uncovers the result.
export function OptimizeEffect({ phase }: { phase: "working" | "reveal" }) {
  return (
    <div className="optimize-effect" data-phase={phase} aria-hidden="true">
      <div className="optimize-veil" />
      <div className="optimize-band" />
    </div>
  );
}

function describe(change: OptimizeChange) {
  if (change.key === "layout") return `${change.before[0]} → ${change.after[0]}`;
  if (change.key === "summary") return "Reworded";
  if (change.before.length !== change.after.length) return "Bullets cleaned up";
  const changed = change.after.filter((line, i) => line !== change.before[i]).length;
  return `${changed} of ${change.after.length} bullet${change.after.length === 1 ? "" : "s"} reworded`;
}

// The lines that changed, old above new
function Diff({ change }: { change: OptimizeChange }) {
  const pairs =
    change.before.length === change.after.length
      ? change.before.map((line, i) => [line, change.after[i]]).filter(([was, now]) => was !== now)
      : [[change.before.join("\n"), change.after.join("\n")]];
  return (
    <div className="mt-2 space-y-3">
      {pairs.map(([was, now], i) => (
        <div key={i} className="text-xs leading-5">
          <p className="whitespace-pre-line text-muted line-through decoration-neutral-600">{was}</p>
          <p className="mt-1 whitespace-pre-line text-foreground">{now}</p>
        </div>
      ))}
    </div>
  );
}

// What Optimize changed, each with its own Revert, plus Undo all
export function OptimizePanel({
  optimized,
  onRevert,
  onUndoAll,
  onClose,
}: {
  optimized: Optimized;
  onRevert: (change: OptimizeChange) => void;
  onUndoAll: () => void;
  onClose: () => void;
}) {
  const [before, after] = optimized.scores;
  const nothing = optimized.changes.length === 0;
  const reworded = optimized.changes.some((change) => change.key !== "layout");
  const ref = useRef<HTMLElement>(null);
  // Brought into view when it appears, so the list of changes is never missed
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  return (
    <section ref={ref} role="status" className="mb-4 scroll-mt-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Sparkle className="text-accent-ink" />
            {nothing ? "Already in good shape" : "Optimized"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {nothing
              ? "Nothing needed changing."
              : `${optimized.changes.length} change${optimized.changes.length === 1 ? "" : "s"}. ${after === before ? `ATS score ${after}` : `ATS score ${before} → ${after}`}.`}
          </p>
          {reworded && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <span className="optimize-mark inline-block h-3 w-6 rounded-sm" aria-hidden="true" />
              Reworded lines are highlighted on the page. Point at one to see what it said before.
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {!nothing && (
            <button
              type="button"
              onClick={onUndoAll}
              className="rounded-full border border-border px-3 py-1 text-xs font-bold transition-colors hover:border-foreground"
            >
              Undo all
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>

      {optimized.note && <p className="mt-3 text-xs text-warning">{optimized.note}</p>}

      {!nothing && (
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {optimized.changes.map((change) => (
            <li key={change.key} className="flex items-start justify-between gap-3 py-2.5">
              {change.key === "layout" ? (
                <p className="min-w-0 text-sm">
                  <span className="font-semibold">{change.label}</span>
                  <span className="text-muted"> · {describe(change)}</span>
                </p>
              ) : (
                <details className="disclosure min-w-0 flex-1">
                  <summary className="cursor-pointer list-none text-sm [&::-webkit-details-marker]:hidden">
                    <span className="font-semibold">{change.label}</span>
                    <span className="text-muted"> · {describe(change)}</span>
                  </summary>
                  <Diff change={change} />
                </details>
              )}
              <button
                type="button"
                onClick={() => onRevert(change)}
                className="shrink-0 text-xs font-bold text-muted transition-colors hover:text-foreground"
              >
                Revert
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
