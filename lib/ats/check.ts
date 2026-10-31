// The shape of one ATS check, and small helpers the checks share. Each check scores 0 to 1 and
// carries a weight, so a resume with real gaps can't reach a full score just by having the basics.

export type CheckStatus = "pass" | "warn" | "fail";

export type AtsCheck = {
  label: string;
  // "read": can the software parse it? "content": will it rank and convince once parsed?
  group: "read" | "content";
  // 0 to 1
  score: number;
  weight: number;
  status: CheckStatus;
  detail: string;
  // What to do about it, when it isn't passing
  fix: string | null;
};

// Full marks pass; under half is a problem to fix; anything between is a warning
export function statusOf(score: number): CheckStatus {
  if (score >= 0.999) return "pass";
  return score < 0.5 ? "fail" : "warn";
}

export const share = (part: number, whole: number) => (whole === 0 ? 0 : part / whole);
export const quote = (text: string) => `"${text.length > 60 ? `${text.slice(0, 57)}…` : text}"`;

// A check before its status is worked out; fix is dropped once it passes
export type CheckDraft = Omit<AtsCheck, "status" | "fix"> & { fix: string };
