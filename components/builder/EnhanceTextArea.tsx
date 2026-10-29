"use client";

import { useState } from "react";
import { TextArea } from "@/components/builder/fields";
import Sparkle from "@/components/ui/Sparkle";
import { callAi, useAiUsesLeft } from "@/lib/client/ai";
import { ENHANCE_STYLES, type EnhanceKind, type EnhanceResult, type EnhanceStyle } from "@/lib/enhance";

type State =
  | { status: "idle" }
  | { status: "loading" }
  // Every suggestion so far, so an earlier one can be picked if it was better; `index` is the one shown
  | { status: "done"; versions: EnhanceResult[]; index: number; refining: EnhanceStyle | null; error: string }
  | { status: "error"; message: string };

const REFINEMENTS = (Object.keys(ENHANCE_STYLES) as EnhanceStyle[]).filter((style) => style !== "polish");

const joinLines = (kind: EnhanceKind, lines: string[]) => lines.join(kind === "bullets" ? "\n" : " ");

const stepButton =
  "grid size-6 place-items-center rounded-full transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === "left" ? "M10 3.5 5.5 8l4.5 4.5" : "M6 3.5 10.5 8 6 12.5"} />
    </svg>
  );
}

// A text box with an optional "Enhance with AI" button. Nothing is sent anywhere unless the
// user clicks it, and the suggestion only replaces their text if they accept it. A suggestion
// can be refined (shorter, more formal, ...) as many times as they like; every round works
// from the user's own text, so refinements can't drift into made-up facts.
export default function EnhanceTextArea({
  kind,
  role,
  current,
  focus,
  onAccept,
  ...textArea
}: React.ComponentProps<typeof TextArea> & {
  kind: EnhanceKind;
  role?: string;
  current?: boolean;
  // Keywords from the target job; when set, wording leans toward the job's terms
  focus?: string[];
  // Applies the accepted suggestion as one undoable change
  onAccept: (value: string) => void;
}) {
  const [state, setState] = useState<State>({ status: "idle" });
  const left = useAiUsesLeft();
  const empty = !textArea.value.trim();
  const tailored = Boolean(focus?.length);

  const enhance = async () => {
    setState({ status: "loading" });
    const reply = await callAi<EnhanceResult>("/api/enhance", { kind, text: textArea.value, role, current, focus });
    setState(
      reply.ok
        ? { status: "done", versions: [reply.data], index: 0, refining: null, error: "" }
        : { status: "error", message: reply.message },
    );
  };

  // Refines the version on screen; the new one is added after all the others
  const refine = async (style: EnhanceStyle, versions: EnhanceResult[], index: number) => {
    setState({ status: "done", versions, index, refining: style, error: "" });
    const reply = await callAi<EnhanceResult>("/api/enhance", {
      kind,
      text: textArea.value,
      previous: joinLines(kind, versions[index].lines),
      style,
      role,
      current,
      focus,
    });
    setState(
      reply.ok
        ? { status: "done", versions: [...versions, reply.data], index: versions.length, refining: null, error: "" }
        : { status: "done", versions, index, refining: null, error: reply.message },
    );
  };

  const showVersion = (index: number) =>
    setState((s) => (s.status === "done" && !s.refining ? { ...s, index, error: "" } : s));

  const accept = (result: EnhanceResult) => {
    onAccept(joinLines(kind, result.lines));
    setState({ status: "idle" });
  };

  return (
    <div>
      <TextArea {...textArea} />

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-500">
          {left > 0 ? `${left} free AI actions left today` : "No AI actions left today"}
        </span>
        <button
          type="button"
          onClick={enhance}
          disabled={empty || state.status === "loading"}
          title="Sends only this text to our AI provider to suggest better wording"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-bold text-foreground transition-colors hover:border-accent hover:text-accent-ink disabled:pointer-events-none disabled:opacity-40"
        >
          {state.status !== "loading" && <Sparkle className="text-accent-ink" />}
          {state.status === "loading" ? "Enhancing…" : tailored ? "Enhance for this job" : "Enhance with AI"}
        </button>
      </div>

      {state.status === "error" && <p className="mt-2 text-xs text-warning">{state.message}</p>}

      {state.status === "done" && (
        <div className="mt-3 rounded-md border border-accent/40 bg-accent/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-accent-ink">
              {state.refining ? `Rewriting: ${ENHANCE_STYLES[state.refining].label.replace(/^↻ /, "")}…` : "Suggested wording"}
            </p>
            {state.versions.length > 1 && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-muted">
                <button
                  type="button"
                  onClick={() => showVersion(state.index - 1)}
                  disabled={state.index === 0 || state.refining !== null}
                  aria-label="Previous version"
                  className={stepButton}
                >
                  <Chevron direction="left" />
                </button>
                <span aria-live="polite" className="min-w-[4.5rem] text-center tabular-nums">
                  Version {state.index + 1} of {state.versions.length}
                </span>
                <button
                  type="button"
                  onClick={() => showVersion(state.index + 1)}
                  disabled={state.index === state.versions.length - 1 || state.refining !== null}
                  aria-label="Next version"
                  className={stepButton}
                >
                  <Chevron direction="right" />
                </button>
              </div>
            )}
          </div>
          <div className={state.refining ? "opacity-40 transition-opacity" : "transition-opacity"}>
            {kind === "bullets" ? (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6">
                {state.versions[state.index].lines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-6">{state.versions[state.index].lines[0]}</p>
            )}
          </div>

          {state.versions[state.index].tip && (
            <p className="mt-3 text-xs text-warning">
              <b>Tip:</b> {state.versions[state.index].tip}
            </p>
          )}

          <div className="mt-4">
            <p className="text-[11px] font-semibold text-muted">Refine it</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {REFINEMENTS.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => refine(style, state.versions, state.index)}
                  disabled={state.refining !== null || left <= 0}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-ink disabled:pointer-events-none disabled:opacity-40"
                >
                  {ENHANCE_STYLES[style].label}
                </button>
              ))}
            </div>
          </div>
          {state.error && <p className="mt-2 text-xs text-warning">{state.error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => accept(state.versions[state.index])}
              disabled={state.refining !== null}
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-40"
            >
              Use this
            </button>
            <button
              type="button"
              onClick={() => setState({ status: "idle" })}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
            >
              Keep mine
            </button>
          </div>
          <p className="mt-3 text-[11px] text-neutral-500">
            AI only rewords what you wrote. Each refinement uses 1 AI action. Check that every fact is still right
            before using it.
          </p>
        </div>
      )}
    </div>
  );
}
