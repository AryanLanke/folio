import Link from "next/link";
import PrivacyLink from "@/components/site/PrivacyLink";
import { FEEDBACK_URL } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-4 px-6 py-6 text-sm text-muted">
        <span>Folio · a free resume builder</span>
        <nav className="flex gap-5">
          <Link href="/builder" className="transition-colors hover:text-foreground">
            Open editor
          </Link>
          <PrivacyLink />
          <a href={FEEDBACK_URL} className="transition-colors hover:text-foreground">
            Send feedback
          </a>
        </nav>
      </div>
    </footer>
  );
}
