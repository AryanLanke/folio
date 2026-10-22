import CheckItem, { tone } from "@/components/resume/CheckItem";
import { type AtsCheck, atsChecks, atsScore, linksHiddenFromAts, resumeToPlainText } from "@/lib/ats";
import type { Resume } from "@/lib/resume";
import { scoreVerdict } from "@/lib/score";

// Things that are true of every Folio PDF, whatever the user types
const GROUPS: { key: AtsCheck["group"]; title: string; help: string }[] = [
  { key: "read", title: "Can the software read it?", help: "What the ATS needs to pull out your details, timeline and skills correctly." },
  {
    key: "content",
    title: "Will it rank well?",
    help: "Once it's read, recruiters search and skim: a clear summary, strong verbs and real numbers stand out.",
  },
];

const BUILT_IN = [
  "Single column, read top to bottom",
  "Real text, not an image",
  "No tables, icons or graphics",
  "Standard section headings",
];

export default function AtsView({ resume }: { resume: Resume }) {
  const checks = atsChecks(resume);
  const score = atsScore(checks);
  const count = (status: AtsCheck["status"]) => checks.filter((c) => c.status === status).length;
  const text = resumeToPlainText(resume);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-accent/40 bg-accent/5 p-5">
        <h2 className="text-base font-bold">What is an ATS?</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          An <b className="text-foreground">applicant tracking system</b> is software that most companies use to
          collect job applications. When you apply online, it reads your resume as plain text, pulls out your name,
          jobs, dates and skills, and lets recruiters search and rank candidates, often before a person ever opens
          your resume. Common ones are Workday, Greenhouse, Lever and Taleo. If the software can&apos;t read
          something, a recruiter may never see it.
        </p>
      </section>

      <section className="rounded-lg bg-surface p-5">
        <p className="text-xs font-semibold text-muted">ATS score</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className={`text-6xl font-bold tabular-nums ${tone(score)}`}>
            {score}
            <span className="text-2xl text-muted">/100</span>
          </span>
          <div className="min-w-0 flex-1 basis-52">
            <p className="font-bold">{scoreVerdict(score)}</p>
            <p className="mt-1 text-sm text-muted">
              <span className="text-accent">{count("pass")} passed</span> ·{" "}
              <span className="text-amber-300">{count("warn")} warnings</span> ·{" "}
              <span className="text-red-400">{count("fail")} to fix</span>. Checks that matter more count for more.
            </p>
          </div>
        </div>
      </section>

      {GROUPS.map((group) => (
        <section key={group.key} className="rounded-lg bg-surface p-5">
          <h2 className="text-base font-bold">{group.title}</h2>
          <p className="mt-1 text-sm text-muted">{group.help}</p>
          <ul className="mt-4 space-y-3">
            {/* Things to fix first */}
            {checks
              .filter((check) => check.group === group.key)
              .sort((a, b) => a.score - b.score)
              .map((check) => (
                <CheckItem key={check.label} {...check} />
              ))}
          </ul>
        </section>
      ))}

      <section className="rounded-lg bg-surface p-5">
        {linksHiddenFromAts(resume) && (
          <p className="mb-5 rounded-md bg-background p-3 text-sm text-muted">
            <b className="text-foreground">About your links:</b> they show as short labels like &quot;LinkedIn&quot;, which
            look clean and stay clickable. But most ATS software reads only the visible text, so it won&apos;t see the
            actual addresses. If a job portal needs your profile URL, set <b className="text-foreground">Links</b> to{" "}
            <b className="text-foreground">Full</b> above the page.
          </p>
        )}
        <div>
          <p className="text-xs font-semibold text-muted">Built into every Folio template</p>
          <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
            {BUILT_IN.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="font-bold text-accent" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg bg-surface p-5">
        <h2 className="text-base font-bold">What the ATS reads</h2>
        <p className="mt-1 text-sm text-muted">
          Your resume as plain text, in the order the software reads it. If something is missing here, the
          ATS won&apos;t see it either.
        </p>
        <pre className="mt-4 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md bg-background p-4 font-mono text-xs leading-5 text-foreground">
          {text || "Nothing yet. Start filling in the editor."}
        </pre>
      </section>
    </div>
  );
}
