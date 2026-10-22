import { type CheckStatus, statusOf } from "@/lib/ats";

// Colors for a score out of 100, shared by the Score and ATS check tabs
export const tone = (score: number) => (score >= 85 ? "text-accent" : score >= 60 ? "text-amber-300" : "text-red-400");
export const bar = (score: number) => (score >= 85 ? "bg-accent" : score >= 60 ? "bg-amber-300" : "bg-red-400");

const MARK: Record<CheckStatus, { icon: string; color: string; label: string }> = {
  pass: { icon: "✓", color: "text-accent", label: "Passed" },
  warn: { icon: "!", color: "text-amber-300", label: "Warning" },
  fail: { icon: "✕", color: "text-red-400", label: "Needs fixing" },
};

// One check: passed, a warning, or something to fix, with what was found and how to fix it
export default function CheckItem({ label, score, detail, fix }: { label: string; score: number; detail: string; fix?: string | null }) {
  const mark = MARK[statusOf(score)];
  return (
    <li className="flex gap-3 text-sm">
      <span className={`mt-0.5 w-4 shrink-0 text-center font-bold ${mark.color}`} aria-label={mark.label}>
        {mark.icon}
      </span>
      <span className="min-w-0">
        <b>{label}</b> <span className="text-muted">{detail}</span>
        {fix && (
          <span className="mt-1 block leading-6">
            <span className={`font-semibold ${mark.color}`}>How to fix: </span>
            {fix}
          </span>
        )}
      </span>
    </li>
  );
}
