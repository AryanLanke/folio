// Bullet points: finding every one on the page, spotting broken ones (typed bullet symbols, two
// bullets on one line, sentences split across lines) and fixing them.

import { EXTRA_KINDS, type Resume, hasExperience, hasExtraItem, hasProject, toLines } from "@/lib/resume";

export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

export function bulletFields(resume: Resume) {
  return [
    ...resume.experience.filter(hasExperience).map((job) => job.bullets),
    ...resume.projects.filter(hasProject).map((project) => project.bullets),
    ...resume.extras.flatMap((extra) =>
      EXTRA_KINDS[extra.kind].bullets ? extra.items.filter(hasExtraItem).map((item) => item.bullets) : [],
    ),
  ];
}

// Every bullet on the page: jobs, projects, and extra sections that have bullets
export function allBullets(resume: Resume) {
  return bulletFields(resume).flatMap(toLines);
}

// Folio draws the bullet itself, so a typed "•" or "-" shows up twice
const TYPED_BULLET = /^[•\-*–—▪●◦‣·]/;
// Two bullets that ended up on one line ("... dashboards • Cut report time ...")
const JOINED_BULLETS = /\s[•▪●◦‣]\s/;
// A line ending mid-phrase means the sentence carries on in the next line
const ENDS_MID_PHRASE = /([,\-–(/&]|\b(and|or|to|with|for|of|in|the|a|an|on|by|using|via|from|at|into|as))$/i;
// True when a line ends mid-phrase, so the sentence must carry on in the next line
export const continuesLine = (line: string) => ENDS_MID_PHRASE.test(line.trim().replace(/\.$/, ""));
// Lowercase tools that can start a real bullet
const LOWERCASE_TOOLS = /^(npm|pandas|numpy|pytest|webpack|git)\b/;

// True when a line carries on the sentence of the line before it: the one before ends
// mid-phrase, or this one is a short lowercase fragment ("platform using FastAPI.")
function continuesFrom(previous: string, line: string) {
  const shortLowercase =
    /^[a-z]+\b/.test(line) && !LOWERCASE_TOOLS.test(line) && !/^i\b/.test(line) && wordCount(line) < 8;
  return continuesLine(previous) || shortLowercase;
}

// Lines that look broken: typed bullet symbols, two bullets in one line, or a sentence split
// across lines (usually from copying a PDF, which breaks lines where the page ran out)
export function brokenBulletLines(text: string) {
  const lines = toLines(text);
  return lines.filter(
    (line, i) => TYPED_BULLET.test(line) || JOINED_BULLETS.test(line) || (i > 0 && continuesFrom(lines[i - 1], line)),
  );
}

// "Fix automatically": the problems brokenBulletLines finds, fixed. Two bullets on one line are
// split apart, typed bullet symbols are removed, and split sentences are joined back together.
export function fixBulletText(text: string) {
  const pieces = toLines(text)
    .flatMap((line) => line.split(JOINED_BULLETS))
    .map((line) => line.replace(/^([•\-*–—▪●◦‣·]\s*)+/, "").trim())
    .filter(Boolean);
  const fixed: string[] = [];
  for (const line of pieces) {
    const previous = fixed.at(-1);
    if (previous !== undefined && continuesFrom(previous, line)) fixed[fixed.length - 1] = `${previous} ${line}`;
    else fixed.push(line);
  }
  return fixed.join("\n");
}

// The same fix for every bullet in the resume: jobs, projects and extra sections with bullets
export function fixBulletFormatting(resume: Resume): Resume {
  return {
    ...resume,
    experience: resume.experience.map((job) => ({ ...job, bullets: fixBulletText(job.bullets) })),
    projects: resume.projects.map((project) => ({ ...project, bullets: fixBulletText(project.bullets) })),
    extras: resume.extras.map((extra) =>
      EXTRA_KINDS[extra.kind].bullets
        ? { ...extra, items: extra.items.map((item) => ({ ...item, bullets: fixBulletText(item.bullets) })) }
        : extra,
    ),
  };
}
