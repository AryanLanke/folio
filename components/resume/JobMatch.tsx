"use client";

import { useEffect, useRef, useState } from "react";
import { callAi } from "@/lib/client/ai";
import { type JobAnalysis, MAX_JOB_LENGTH, matchResume } from "@/lib/jobmatch";
import { type JobTarget, type Resume, emptyTarget } from "@/lib/resume";

function Chip({ text, found }: { text: string; found: boolean }) {
  return (
    <li
      className={`chip-in rounded-full px-3 py-1 text-xs font-semibold ${
        found ? "bg-accent/15 text-accent" : "bg-amber-400/15 text-amber-300"
      }`}
    >
      {found ? "✓ " : ""}
      {text}
    </li>
  );
}

// The score counts up from 0 when it first shows, then glides to each new value as the resume
// changes. People who turn animations off see the number straight away.
function useCountUp(value: number) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const duration = 600 + Math.abs(value - start) * 12;
    // Timed from the first frame's own timestamp, so every step uses the same clock
    let began: number | undefined;
    let frame = requestAnimationFrame(function step(now) {
      began ??= now;
      const t = Math.min(1, (now - began) / duration);
      const next = Math.round(start + (value - start) * (1 - (1 - t) ** 3));
      from.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return shown;
}

function Meter({ score, tone, children }: { score: number; tone: string; children: React.ReactNode }) {
  const shown = useCountUp(score);
  return (
    <div className="mt-5 flex items-center gap-4">
      {/* Wide enough for "100%", so the bar and text beside it stay put while the number counts */}
      <span className={`min-w-[2.8em] text-5xl font-bold tabular-nums transition-colors duration-500 ${tone}`}>
        {shown}%
      </span>
      <div className="min-w-0 flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-background">
          <div
            className={`h-full rounded-full transition-colors duration-500 ${score >= 75 ? "bg-accent" : score >= 50 ? "bg-amber-300" : "bg-red-400"}`}
            style={{ width: `${shown}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted">{children}</p>
      </div>
    </div>
  );
}

// Paste a job posting, see how well the resume covers what it asks for, and what's missing.
// AI reads the posting once; the score then updates live as the resume is edited.
export default function JobMatch({
  resume,
  onChange,
  onWriteCoverLetter,
}: {
  resume: Resume;
  onChange: (target: JobTarget, checkpoint?: boolean) => void;
  onWriteCoverLetter: () => void;
}) {
  const { target } = resume;
  const [draft, setDraft] = useState(target.description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    setBusy(true);
    setError("");
    const reply = await callAi<JobAnalysis>("/api/job", { description: draft });
    setBusy(false);
    if (!reply.ok) {
      setError(reply.message);
      return;
    }
    onChange({ description: draft.trim(), ...reply.data }, true);
  };

  if (target.keywords.length === 0) {
    return (
      <section className="rounded-lg bg-surface p-5">
        <h2 className="text-base font-bold">Match your resume to a job</h2>
        <p className="mt-1 text-sm text-muted">
          Paste a job posting. Folio picks out the skills and keywords it asks for, shows which ones your
          resume already covers, and tailors AI suggestions to this job.
        </p>
        <textarea
          className="mt-4 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-neutral-600 focus:border-accent"
          rows={10}
          maxLength={MAX_JOB_LENGTH}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste the full job description here…"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-neutral-500">Uses 1 free AI action. Only the job posting is sent.</span>
          <button
            type="button"
            onClick={analyze}
            disabled={busy || draft.trim().length < 50}
            className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-40"
          >
            {busy ? "Reading the job…" : "Analyze job"}
          </button>
        </div>
        {draft.trim().length > 0 && draft.trim().length < 50 && (
          <p className="mt-2 text-xs text-muted">Paste the whole posting, not just the title.</p>
        )}
        {error && <p className="mt-2 text-xs text-amber-300">{error}</p>}
      </section>
    );
  }

  const { score, matched, missing } = matchResume(resume, target.keywords);
  const tone = score >= 75 ? "text-accent" : score >= 50 ? "text-amber-300" : "text-red-400";
  const verdict =
    score >= 75
      ? "Strong match. Your resume covers most of what this job asks for."
      : score >= 50
        ? "Decent match. Covering a few more of the missing terms would help."
        : "Weak match. Recruiters searching for this job's keywords may not find you.";

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted">Matching against</p>
            <h2 className="truncate text-base font-bold">
              {target.title || "This job"}
              {target.company && <span className="font-normal text-muted"> at {target.company}</span>}
            </h2>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onChange({ ...target, keywords: [] })}
              className="rounded px-2 py-1 text-xs font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              Change job
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft("");
                onChange(emptyTarget(), true);
              }}
              className="rounded px-2 py-1 text-xs font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-red-400"
            >
              Remove
            </button>
          </div>
        </div>

        <Meter score={score} tone={tone}>
          {matched.length} of {target.keywords.length} keywords found. {verdict}
        </Meter>
      </section>

      {missing.length > 0 && (
        <section className="rounded-lg bg-surface p-5">
          <h3 className="text-sm font-bold">Missing from your resume</h3>
          <p className="mt-1 text-sm text-muted">
            Add these <b className="text-foreground">only if you really have them</b>: in Skills, or in a bullet
            that shows where you used them. The score updates as you type.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {missing.map((keyword) => (
              <Chip key={keyword} text={keyword} found={false} />
            ))}
          </ul>
        </section>
      )}

      {matched.length > 0 && (
        <section className="rounded-lg bg-surface p-5">
          <h3 className="text-sm font-bold">Already on your resume</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {matched.map((keyword) => (
              <Chip key={keyword} text={keyword} found />
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-dashed border-border p-5 text-sm text-muted">
        <p>
          <b className="text-foreground">AI suggestions are now tailored to this job.</b> They use the job&apos;s
          wording for skills you already have, and never add ones you don&apos;t.
        </p>
        <button
          type="button"
          onClick={onWriteCoverLetter}
          className="mt-3 font-bold text-accent transition-colors hover:text-accent-hover"
        >
          Write a cover letter for this job →
        </button>
      </section>
    </div>
  );
}
