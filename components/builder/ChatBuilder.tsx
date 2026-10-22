"use client";

import { useEffect, useRef, useState } from "react";
import MicIcon from "@/components/ui/MicIcon";
import { useEscape } from "@/components/ui/useEscape";
import { callAi } from "@/lib/client/ai";
import { type ChatTurn, MAX_TURNS, OPENING } from "@/lib/interview";
import { type Resume, normalizeResume } from "@/lib/resume";

// The browser's built-in speech-to-text (Chrome, Edge, Safari). Not in TypeScript's DOM types yet.
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

function createRecognition(): Recognition | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

// "Build with AI": chat (or talk) about your work, and AI writes the resume from it.
// Chat messages are free; only "Create my resume" uses one of the daily AI actions.
// What to tell the person when voice typing stops with an error ("no-speech" just stops quietly)
const VOICE_ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in your browser, or type instead.",
  "service-not-allowed": "Voice typing isn't allowed in this browser. Type instead.",
  "audio-capture": "No microphone was found. Check it's connected, or type instead.",
  network: "Voice typing needs an internet connection. Type instead, or try again.",
  unavailable: "Voice typing isn't available right now. Type instead.",
};

export default function ChatBuilder({
  turns,
  onTurnsChange,
  onCreated,
  onClose,
}: {
  // Kept by the parent, so closing and reopening the chat continues the conversation
  turns: ChatTurn[];
  onTurnsChange: (turns: ChatTurn[]) => void;
  onCreated: (resume: Resume) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [canListen] = useState(() => createRecognition() !== null);
  useEscape(onClose, !creating);
  const recognition = useRef<Recognition | null>(null);
  const spokenBase = useRef("");
  const bottom = useRef<HTMLDivElement>(null);

  const conversation: ChatTurn[] = turns.length > 0 ? turns : [{ role: "assistant", content: OPENING }];
  const shared = conversation.some((t) => t.role === "user");
  const atLimit = conversation.length >= MAX_TURNS - 1;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation.length, thinking]);

  useEffect(() => () => recognition.current?.stop(), []);

  const stopListening = () => {
    recognition.current?.stop();
    setListening(false);
  };

  const toggleMic = () => {
    if (listening) {
      stopListening();
      return;
    }
    const rec = createRecognition();
    if (!rec) return;
    rec.lang = navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    spokenBase.current = draft ? `${draft.trimEnd()} ` : "";
    rec.onresult = (event) => {
      let finalText = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      setDraft(spokenBase.current + finalText + interim);
    };
    rec.onerror = (event) => {
      const message = VOICE_ERRORS[event.error];
      if (message) setError(message);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognition.current = rec;
    // Some browsers throw here instead of calling onerror (for example, if the mic is busy)
    try {
      rec.start();
    } catch {
      setError(VOICE_ERRORS.unavailable);
      return;
    }
    setListening(true);
    setError("");
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || thinking) return;
    stopListening();
    const next: ChatTurn[] = [...conversation, { role: "user", content: text }];
    onTurnsChange(next);
    setDraft("");
    setThinking(true);
    setError("");
    const reply = await callAi<{ reply: string; ready: boolean }>("/api/chat", { messages: next }, { count: false });
    setThinking(false);
    if (!reply.ok) {
      setError(reply.message);
      return;
    }
    onTurnsChange([...next, { role: "assistant", content: reply.data.reply }]);
    setReady(reply.data.ready);
  };

  const create = async () => {
    stopListening();
    setCreating(true);
    setError("");
    const reply = await callAi<{ resume: unknown }>("/api/chat/resume", { messages: conversation });
    setCreating(false);
    const resume = reply.ok ? normalizeResume(reply.data.resume) : null;
    if (!resume) {
      setError(reply.ok ? "Couldn't build a resume from this yet. Tell me a bit more about your work." : reply.message);
      return;
    }
    onCreated(resume);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={creating ? undefined : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
        className="flex h-[92dvh] w-full max-w-xl flex-col rounded-t-xl bg-surface shadow-2xl sm:h-[85dvh] sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 id="chat-title" className="text-lg font-bold">
              Build with AI
            </h2>
            <p className="text-sm text-muted">Chat or talk. AI writes your resume from what you say, nothing more.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            aria-label="Close"
            className="rounded px-2 py-1 text-lg text-muted transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
          {conversation.map((turn, i) => (
            <div key={i} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  turn.role === "user" ? "rounded-br-sm bg-accent text-black" : "rounded-bl-sm bg-background text-foreground"
                }`}
              >
                {turn.content}
              </p>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <p className="rounded-2xl rounded-bl-sm bg-background px-4 py-2.5 text-sm text-muted">Thinking…</p>
            </div>
          )}
          <div ref={bottom} />
        </div>

        <div className="border-t border-border p-4">
          {error && <p className="mb-2 text-xs text-amber-300">{error}</p>}
          {atLimit ? (
            <p className="mb-2 text-xs text-muted">That&apos;s plenty to work with. Press Create my resume.</p>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none placeholder:text-neutral-600 focus:border-accent"
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={listening ? "Listening… speak naturally" : "Type here, or tap the mic and talk"}
                disabled={creating}
              />
              {canListen && (
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={creating}
                  aria-label={listening ? "Stop voice typing" : "Start voice typing"}
                  aria-pressed={listening}
                  className={`relative flex size-11 shrink-0 items-center justify-center rounded-full border text-xl transition-colors ${
                    listening
                      ? "border-red-400/70 bg-red-500/15 text-red-300"
                      : "border-border text-muted hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {listening && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-red-400/60 motion-safe:animate-ping"
                    />
                  )}
                  <MicIcon active={listening} />
                </button>
              )}
              <button
                type="button"
                onClick={send}
                disabled={!draft.trim() || thinking || creating}
                className="h-11 shrink-0 rounded-full bg-foreground px-4 text-sm font-bold text-background transition-opacity hover:opacity-85 disabled:opacity-30"
              >
                Send
              </button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-500">
              Chatting is free. Creating uses 1 AI action.
              {canListen && " Voice typing uses your browser's speech service."}
            </span>
            <button
              type="button"
              onClick={create}
              disabled={!shared || thinking || creating}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                ready || atLimit ? "bg-accent text-black hover:bg-accent-hover" : "border border-border text-foreground hover:border-accent"
              }`}
            >
              {creating ? "Writing your resume…" : "Create my resume"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
