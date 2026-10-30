"use client";

import { useState } from "react";
import { TextArea } from "@/components/builder/fields";
import Sparkle from "@/components/ui/Sparkle";
import { callAi, useAiUsesLeft } from "@/lib/client/ai";
import { coverLetterRequest } from "@/lib/coverletter";
import { type Resume, hasExperience } from "@/lib/resume";

// Write a cover letter: AI drafts one from the resume (and the target job), then it's
// a normal text box the user can edit freely.
export default function CoverLetterEditor({
  resume,
  onChange,
  onOpenJobMatch,
}: {
  resume: Resume;
  onChange: (letter: string, checkpoint?: boolean) => void;
  onOpenJobMatch: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const left = useAiUsesLeft();
  const { target } = resume;
  const hasJob = target.keywords.length > 0;
  const enoughResume = Boolean(resume.basics.name && resume.experience.some(hasExperience));

  const write = async () => {
    if (resume.coverLetter.trim() && !confirm("Replace your current cover letter with a new draft? You can undo this.")) return;
    setBusy(true);
    setError("");
    const reply = await callAi<{ letter: string }>("/api/cover-letter", coverLetterRequest(resume));
    setBusy(false);
    if (reply.ok) onChange(reply.data.letter, true);
    else setError(reply.message);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-surface p-5">
        <h2 className="text-base font-bold">Cover letter</h2>
        {hasJob ? (
          <p className="mt-1 text-sm text-muted">
            Written for <b className="text-foreground">{target.title || "your target job"}</b>
            {target.company && (
              <>
                {" "}
                at <b className="text-foreground">{target.company}</b>
              </>
            )}
            , using only facts from your resume.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            AI drafts it from your resume. For a letter aimed at a specific job,{" "}
            <button type="button" onClick={onOpenJobMatch} className="font-bold text-accent-ink hover:text-accent-ink-hover">
              add the job in Job match
            </button>{" "}
            first.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted">
            {left > 0 ? `Uses 1 of your ${left} free AI actions left today` : "No AI actions left today"}
          </span>
          <button
            type="button"
            onClick={write}
            disabled={busy || !enoughResume}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-40"
          >
            {!busy && <Sparkle />}
            {busy ? "Writing…" : resume.coverLetter.trim() ? "Write a new draft" : "Write with AI"}
          </button>
        </div>
        {!enoughResume && (
          <p className="mt-2 text-xs text-muted">Add your name and at least one job to the resume first.</p>
        )}
        {error && <p className="mt-2 text-xs text-warning">{error}</p>}
      </section>

      <section className="rounded-lg bg-surface p-5">
        <TextArea
          label="Your letter"
          hint="Edit freely. Leave a blank line between paragraphs."
          rows={18}
          value={resume.coverLetter}
          onChange={(v) => onChange(v)}
          placeholder={"Dear Hiring Manager,\n\nI'm applying for…"}
        />
        <p className="mt-3 text-xs text-muted">
          Read it through before sending. AI can get the tone right, but you know what&apos;s true.
        </p>
      </section>
    </div>
  );
}
