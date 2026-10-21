"use client";

import { useState } from "react";
import { TextArea } from "@/components/builder/fields";
import type { EnhanceKind, EnhanceResult } from "@/lib/enhance";
import { aiUsesLeft, recordAiUse } from "@/lib/storage";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: EnhanceResult }
  | { status: "error"; message: string };

const ERRORS: Record<string, string> = {
  not_configured: "AI enhance isn't set up yet.",
  limit: "You've used today's free enhancements. They reset tomorrow.",
  busy: "AI is busy right now. Try again in a minute.",
};

// A text box with an optional "Enhance with AI" button. Nothing is sent anywhere
// unless the user clicks it, and the suggestion only replaces their text if they accept it.
export default function EnhanceTextArea({
  kind,
  role,
  current,
  onAccept,
  ...textArea
}: React.ComponentProps<typeof TextArea> & {
  kind: EnhanceKind;
  role?: string;
  current?: boolean;
  // Applies the accepted suggestion as one undoable change
  onAccept: (value: string) => void;
}) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [left, setLeft] = useState(aiUsesLeft);
  const empty = !textArea.value.trim();

  const enhance = async () => {
    if (left <= 0) {
      setState({ status: "error", message: ERRORS.limit });
      return;
    }
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, text: textArea.value, role, current }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.lines) {
        setState({ status: "error", message: ERRORS[data?.error] ?? "Couldn't enhance right now. Try again." });
        return;
      }
      recordAiUse();
      setLeft(aiUsesLeft());
      setState({ status: "done", result: data as EnhanceResult });
    } catch {
      setState({ status: "error", message: "Couldn't reach the AI. Check your connection and try again." });
    }
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
          {left > 0 ? `${left} free AI enhancements left today` : "No AI enhancements left today"}
        </span>
        <button
          type="button"
          onClick={enhance}
          disabled={empty || state.status === "loading"}
          title="Sends only this text to our AI provider to suggest better wording"
          className="rounded-full border border-border px-3 py-1 text-xs font-bold text-foreground transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
        >
          {state.status === "loading" ? "Enhancing…" : "✨ Enhance with AI"}
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
