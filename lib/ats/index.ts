// What applicant tracking systems (Workday, Greenhouse, Taleo, ...) get out of the PDF, and the
// ATS check: everything screening software needs to read the resume, and what makes it rank and
// read well once it has.
//
// plaintext.ts  the plain text the software reads
// bullets.ts    finding and fixing broken bullet points
// check.ts      the shape of a check, and helpers the checks share
// read-checks.ts, content-checks.ts  the checks themselves

import { type AtsCheck, statusOf } from "@/lib/ats/check";
import { contentChecks } from "@/lib/ats/content-checks";
import { readChecks } from "@/lib/ats/read-checks";
import type { Resume } from "@/lib/resume";
import { plainResume } from "@/lib/rich";

export { linksHiddenFromAts, resumeToPlainText } from "@/lib/ats/plaintext";
export { allBullets, brokenBulletLines, continuesLine, fixBulletFormatting, fixBulletText } from "@/lib/ats/bullets";
export { type AtsCheck, type CheckStatus, quote, share, statusOf } from "@/lib/ats/check";

export function atsChecks(formatted: Resume): AtsCheck[] {
  const resume = plainResume(formatted);
  return [...readChecks(resume), ...contentChecks(resume)].map((check) => {
    const status = statusOf(check.score);
    return { ...check, status, fix: status === "pass" ? null : check.fix };
  });
}

// One number out of 100, weighted so the checks that matter most count most
export function atsScore(checks: AtsCheck[]) {
  const total = checks.reduce((sum, check) => sum + check.weight, 0);
  return Math.round((checks.reduce((sum, check) => sum + check.score * check.weight, 0) / total) * 100);
}
