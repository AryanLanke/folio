import { atsChecks, resumeToPlainText } from "@/lib/ats";
import type { Resume } from "@/lib/resume";

// Things that are true of every Folio PDF, whatever the user types
const BUILT_IN = [
  "Single column, read top to bottom",
  "Real text, not an image",
  "No tables, icons or graphics",
  "Standard section headings",
];

export default function AtsView({ resume }: { resume: Resume }) {
  const checks = atsChecks(resume);
  const passed = checks.filter((c) => c.ok).length;
  const text = resumeToPlainText(resume);

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-surface p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-bold">ATS readiness</h2>
          <span className={`text-sm font-bold ${passed === checks.length ? "text-accent" : "text-amber-300"}`}>
            {passed} / {checks.length} checks passed
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Companies run resumes through applicant tracking systems like Workday, Greenhouse and Taleo before a
          person reads them. These checks cover what that software needs.
        </p>
        <ul className="mt-4 space-y-3">
          {checks.map((check) => (
            <li key={check.label} className="flex gap-3 text-sm">
              <span className={`font-bold ${check.ok ? "text-accent" : "text-amber-300"}`} aria-hidden>
                {check.ok ? "✓" : "!"}
              </span>
              <span>
                <b>{check.label}</b> <span className="text-muted">{check.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-border pt-4">
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
