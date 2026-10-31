// Sorting the links a PDF gives: personal ones stay in the header, and a link to one repository
// moves to the project it belongs to.

import { linkKey, repoName, splitLinks, withoutTracking } from "@/lib/links";
import type { Resume } from "@/lib/resume";

// Words too common in project and repository names to show they're the same project
const GENERIC_WORDS = new Set([
  "app", "application", "project", "projects", "web", "website", "site", "system", "api", "backend",
  "frontend", "the", "and", "for", "with", "using", "tool", "platform", "based", "management", "my",
]);

const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
const nameWords = (text: string) =>
  text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length >= 3 && !GENERIC_WORDS.has(word));

// How well a repository name fits a project name: "budget-buddy" fits "Budget Buddy" exactly,
// "fastapi-compliance-platform" fits "Compliance Platform" by a shared word. 0 means no fit.
function fit(repo: string, project: string) {
  const a = squash(repo);
  const b = squash(project);
  if (!a || !b) return 0;
  if (a === b) return 100;
  const shared = new Set(nameWords(project));
  const words = nameWords(repo).filter((word) => shared.has(word)).length;
  const contains = Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a)) ? 10 : 0;
  return contains + words;
}

// Each link once, without share-tracking tails ("?utm_source=share_via...")
const uniqueLinks = (links: string[]) => {
  const seen = new Set<string>();
  return links.map(withoutTracking).filter((link) => {
    const key = linkKey(link);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// A PDF lists every link in the file, and the model tends to put them all in the header, so
// the header ends up with "GitHub" five times. The header keeps personal links (LinkedIn, the
// GitHub profile, portfolio, LeetCode); a link to one repository moves to the project it
// belongs to; and each link appears once.
export function sortLinks(resume: Resume): Resume {
  const projects = resume.projects.map((project) => ({ project, links: uniqueLinks(splitLinks(project.link)) }));
  const onProjects = new Set(projects.flatMap((p) => p.links.map(linkKey)));
  const header: string[] = [];
  const unplaced: string[] = [];

  for (const link of uniqueLinks(splitLinks(resume.basics.link))) {
    const repo = repoName(link);
    if (!repo) {
      header.push(link);
      continue;
    }
    // Already on its project, so it only needs to leave the header
    if (onProjects.has(linkKey(link))) continue;
    const scores = projects.map((p) => fit(repo, p.project.name));
    const best = Math.max(0, ...scores);
    const target = best > 0 && scores.filter((s) => s === best).length === 1 ? projects[scores.indexOf(best)] : null;
    if (target) target.links.push(link);
    else unplaced.push(link);
  }

  // Links come in the order they appear in the file, so when the leftover repository links and
  // the projects still without a link are the same number, they pair up in order. Otherwise
  // they stay in the header, where the person can see them, rather than being lost.
  const linkless = projects.filter((p) => p.links.length === 0);
  if (unplaced.length > 0 && unplaced.length === linkless.length) linkless.forEach((p, i) => p.links.push(unplaced[i]));
  else header.push(...unplaced);

  return {
    ...resume,
    basics: { ...resume.basics, link: header.join(", ") },
    projects: projects.map((p) => ({ ...p.project, link: p.links.join(", ") })),
  };
}
