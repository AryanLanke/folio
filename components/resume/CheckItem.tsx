import { type CheckStatus, fixBulletFormatting, statusOf } from "@/lib/ats";
import type { Resume } from "@/lib/resume";

// A "Fix automatically" button for checks Folio can fix itself, shown only when the fix would
// change something. The change goes through the editor's update, so Undo reverses it.
export function checkAction(label: string, resume: Resume, onChange?: (next: Resume) => void) {
  if (!onChange || label !== "Bullet formatting") return undefined;
  const fixed = fixBulletFormatting(resume);
  if (JSON.stringify(fixed) === JSON.stringify(resume)) return undefined;
  return (
    <button
      type="button"
      onClick={() => onChange(fixed)}
      className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-black transition-colors hover:bg-accent-hover"
    >
      Fix automatically
    </button>
  );
}

// Colors for a score out of 100, shared by the Score and ATS check tabs
export const tone = (score: number) => (score >= 85 ? "text-accent" : score >= 60 ? "text-amber-300" : "text-red-400");
export const bar = (score: number) => (score >= 85 ? "bg-accent" : score >= 60 ? "bg-amber-300" : "bg-red-400");

const MARK: Record<CheckStatus, { icon: string; color: string; label: string }> = {
  pass: { icon: "✓", color: "text-accent", label: "Passed" },
  warn: { icon: "!", color: "text-amber-300", label: "Warning" },
  fail: { icon: "✕", color: "text-red-400", label: "Needs fixing" },
};

// One check: passed, a warning, or something to fix, with what was found and how to fix it.
// "action" is a button that fixes it automatically, when there is one.
export default function CheckItem({
  label,
  score,
  detail,
  fix,
  action,
}: {
  label: string;
  score: number;
  detail: string;
  fix?: string | null;
  action?: React.ReactNode;
}) {
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
        {fix && action && <span className="mt-2 block">{action}</span>}
      </span>
    </li>
  );
}
