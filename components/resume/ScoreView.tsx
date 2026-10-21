import { type Resume } from "@/lib/resume";
import { type ScoreItem, scoreResume, scoreVerdict } from "@/lib/score";

const tone = (score: number) => (score >= 85 ? "text-accent" : score >= 60 ? "text-amber-300" : "text-red-400");
const bar = (score: number) => (score >= 85 ? "bg-accent" : score >= 60 ? "bg-amber-300" : "bg-red-400");

const PART_HELP: Record<string, string> = {
  ats: "Can applicant tracking systems read it? Companies use this software to collect and filter resumes before a person sees them.",
  writing: "Will a recruiter be convinced? Clear actions, real numbers, and no filler.",
  job: "Does it use the words the job posting asks for?",
};

function Item({ item }: { item: ScoreItem }) {
  const full = item.score >= 0.999;
  const none = item.score <= 0.001;
  return (
    <li className="flex gap-3 text-sm">
      <span
        className={`mt-0.5 w-4 shrink-0 text-center font-bold ${full ? "text-accent" : none ? "text-red-400" : "text-amber-300"}`}
        aria-label={full ? "Passed" : none ? "Missing" : "Partly"}
      >
        {full ? "✓" : "!"}
      </span>
      <span>
        <b>{item.label}</b> <span className="text-muted">{item.detail}</span>
      </span>
    </li>
  );
}

// One score out of 100, broken into the parts and checks it's made of, each with what to fix
export default function ScoreView({ resume }: { resume: Resume }) {
  const { total, parts } = scoreResume(resume);

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-surface p-5">
        <p className="text-xs font-semibold text-muted">Resume score</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className={`text-6xl font-bold tabular-nums ${tone(total)}`}>
            {total}
            <span className="text-2xl text-muted">/100</span>
          </span>
          <div className="min-w-0 flex-1 basis-52">
            <p className="font-bold">{scoreVerdict(total)}</p>
            <p className="mt-1 text-sm text-muted">
              Every point comes from a check below. Fix the ones marked, and the score updates as you edit.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {parts.map((part) => (
            <div key={part.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-bold">{part.label}</span>
                <span className={`font-bold tabular-nums ${tone(part.score)}`}>{part.score}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background">
                <div className={`h-full rounded-full ${bar(part.score)}`} style={{ width: `${part.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {parts.map((part) => (
        <section key={part.key} className="rounded-lg bg-surface p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-bold">{part.label}</h2>
            <span className={`text-sm font-bold tabular-nums ${tone(part.score)}`}>{part.score}/100</span>
          </div>
          <p className="mt-1 text-sm text-muted">{PART_HELP[part.key]}</p>
          <ul className="mt-4 space-y-3">
            {/* Things to fix first */}
            {[...part.items]
              .sort((a, b) => a.score - b.score)
              .map((item) => (
                <Item key={item.label} item={item} />
              ))}
          </ul>
        </section>
      ))}

      {!parts.some((part) => part.key === "job") && (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
          Add a job posting in <b className="text-foreground">Job match</b> to also score how well your resume fits that
          job.
        </p>
      )}
    </div>
  );
}
