"use client";

import { useState } from "react";
import { callAi } from "@/lib/client/ai";
import { MAX_IMPORT_LENGTH } from "@/lib/importer";
import { type Resume, normalizeResume } from "@/lib/resume";

// Brings in an existing resume: upload a PDF or paste the text, and AI sorts it into fields.
export default function ImportDialog({
  onImported,
  onClose,
}: {
  onImported: (resume: Resume) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"pdf" | "text">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ready = mode === "pdf" ? file !== null : text.trim().length >= 100;

  const start = async () => {
    setBusy(true);
    setError("");
    let body: object | FormData;
    if (mode === "pdf" && file) {
      const form = new FormData();
      form.append("file", file);
      body = form;
    } else {
      body = { text };
    }
    const reply = await callAi<{ resume: unknown }>("/api/import", body);
    setBusy(false);
    const resume = reply.ok ? normalizeResume(reply.data.resume) : null;
    if (!resume) {
      setError(reply.ok ? "Couldn't find a resume in that. Try pasting the text instead." : reply.message);
      return;
    }
    onImported(resume);
  };

  const tab = (value: "pdf" | "text", label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`flex-1 rounded-full py-1.5 text-sm font-bold transition-colors ${
        mode === value ? "bg-foreground text-background" : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={busy ? undefined : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="import-title" className="text-lg font-bold">
          Import your current resume
        </h2>
        <p className="mt-1 text-sm text-muted">
          Folio fills in every field for you, using your exact words. You can polish it afterwards.
        </p>

        <div className="mt-5 flex gap-1 rounded-full bg-background p-1">
          {tab("pdf", "Upload PDF")}
          {tab("text", "Paste text")}
        </div>

        {mode === "pdf" ? (
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-4 py-8 text-center transition-colors hover:border-accent">
            <span className="text-sm font-bold">{file ? file.name : "Choose a PDF"}</span>
            <span className="text-xs text-muted">
              {file ? `${(file.size / 1024).toFixed(0)} KB · click to change` : "Up to 4 MB"}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        ) : (
          <textarea
            className="mt-4 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-neutral-600 focus:border-accent"
            rows={9}
            maxLength={MAX_IMPORT_LENGTH}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Open your resume (Word, Google Docs, anything), select all, copy, and paste it here."
          />
        )}

        <p className="mt-3 text-xs text-neutral-500">
          Uses 1 free AI action. Your file is read once to get the text and is not stored anywhere.
        </p>
        {error && <p className="mt-2 text-sm text-amber-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={start}
            disabled={!ready || busy}
            className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-40"
          >
            {busy ? "Reading your resume…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
