import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-4 px-6 py-6 text-sm text-muted">
        <span>Folio · a free, open-source resume builder</span>
        <nav className="flex gap-5">
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <a href="https://github.com/AryanLanke/resume-builder" className="transition-colors hover:text-foreground">
            Source on GitHub
          </a>
          <a
            href="https://github.com/AryanLanke/resume-builder/issues/new"
            className="transition-colors hover:text-foreground"
          >
            Send feedback
          </a>
        </nav>
      </div>
    </footer>
  );
}
