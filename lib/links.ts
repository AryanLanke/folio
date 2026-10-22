// Links on the resume show as short labels ("LinkedIn", "GitHub") that open the full address,
// or as the address itself. Used by the preview, PDF, Word and ATS views alike.

export type LinkMode = "label" | "url";

const KNOWN_SITES: [RegExp, string][] = [
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/(^|\.)github\.com$/, "GitHub"],
  [/(^|\.)gitlab\.com$/, "GitLab"],
  [/(^|\.)bitbucket\.org$/, "Bitbucket"],
  [/(^|\.)behance\.net$/, "Behance"],
  [/(^|\.)dribbble\.com$/, "Dribbble"],
  [/(^|\.)kaggle\.com$/, "Kaggle"],
  [/(^|\.)leetcode\.com$/, "LeetCode"],
  [/(^|\.)stackoverflow\.com$/, "Stack Overflow"],
  [/(^|\.)medium\.com$/, "Medium"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/(^|\.)(x|twitter)\.com$/, "X"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)figma\.com$/, "Figma"],
];

// A link field can hold several links, separated by commas, spaces or new lines
export function splitLinks(text: string) {
  return text
    .split(/[\s,;|]+/)
    .map((part) => part.trim().replace(/[.)]+$/, ""))
    .filter(Boolean);
}

// The full address to open, with https:// added if it was left out
export function linkHref(text: string) {
  const trimmed = text.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function hostOf(text: string) {
  try {
    return new URL(linkHref(text)).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

// "LinkedIn" for linkedin.com, "GitHub" for github.com, otherwise the domain name
export function linkLabel(text: string) {
  const host = hostOf(text);
  if (!host) return text.trim();
  return KNOWN_SITES.find(([pattern]) => pattern.test(host))?.[1] ?? host;
}

// The address without https://, www. or a trailing slash, for showing in full
export function linkDisplay(text: string) {
  return text
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

// The same address however it's written: "https://www.GitHub.com/priya/" and "github.com/priya"
export function linkKey(text: string) {
  return linkDisplay(text).toLowerCase().replace(/[?#].*$/, "").replace(/\/$/, "");
}

const CODE_HOSTS = /(^|\.)(github\.com|gitlab\.com|bitbucket\.org)$/;

// For a link to one repository rather than to a person's profile, the repository's name:
// "budget-app" for github.com/priya/budget-app or priya.github.io/budget-app. Null for
// profiles (github.com/priya, priya.github.io) and every other link.
export function repoName(text: string): string | null {
  const host = hostOf(text);
  let parts: string[];
  try {
    parts = new URL(linkHref(text)).pathname.split("/").filter(Boolean);
  } catch {
    return null;
  }
  if (CODE_HOSTS.test(host) && parts.length >= 2) return parts[1].replace(/\.git$/, "");
  if (host.endsWith(".github.io") && parts.length >= 1) return parts[0];
  return null;
}

export type ResumeLink = { text: string; href: string };

// Every link in a field, ready to draw: the visible text and the address it opens
export function resumeLinks(field: string, mode: LinkMode): ResumeLink[] {
  return splitLinks(field).map((link) => ({
    text: mode === "label" ? linkLabel(link) : linkDisplay(link),
    href: linkHref(link),
  }));
}

// The contact line under the name: email, phone, city, then links. Items with an href are clickable.
export function contactItems(
  basics: { email: string; phone: string; location: string; link: string },
  mode: LinkMode,
): { text: string; href?: string }[] {
  return [
    ...(basics.email ? [{ text: basics.email, href: `mailto:${basics.email}` }] : []),
    ...(basics.phone ? [{ text: basics.phone }] : []),
    ...(basics.location ? [{ text: basics.location }] : []),
    ...resumeLinks(basics.link, mode),
  ];
}
