"use client";

import { useState } from "react";
import { TextArea } from "@/components/builder/fields";
import { callAi, useAiUsesLeft } from "@/lib/client/ai";
import type { EnhanceKind, EnhanceResult } from "@/lib/enhance";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: EnhanceResult }
  | { status: "error"; message: string };

// A text box with an optional "Enhance with AI" button. Nothing is sent anywhere
// unless the user clicks it, and the suggestion only replaces their text if they accept it.
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
    setState(reply.ok ? { status: "done", result: reply.data } : { status: "error", message: reply.message });
  };

  const accept = (result: EnhanceResult) => {
    onAccept(result.lines.join(kind === "bullets" ? "\n" : " "));
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
          className="rounded-full border border-border px-3 py-1 text-xs font-bold text-foreground transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
        >
          {state.status === "loading" ? "Enhancing…" : tailored ? "✨ Enhance for this job" : "✨ Enhance with AI"}
        </button>
      </div>

      {state.status === "error" && <p className="mt-2 text-xs text-amber-300">{state.message}</p>}

      {state.status === "done" && (
        <div className="mt-3 rounded-md border border-accent/40 bg-accent/5 p-4">
          <p className="text-xs font-bold text-accent">Suggested wording</p>
          {kind === "bullets" ? (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6">
              {state.result.lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-6">{state.result.lines[0]}</p>
          )}

          {state.result.tip && (
            <p className="mt-3 text-xs text-amber-300">
              <b>Tip:</b> {state.result.tip}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => accept(state.result)}
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-black transition-colors hover:bg-accent-hover"
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
            AI only rewords what you wrote. Check that every fact is still right before using it.
          </p>
        </div>
      )}
    </div>
  );
}
