import Link from "next/link";
import PrivacyLink from "@/components/site/PrivacyLink";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Folio<span className="text-accent-ink">.</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-bold">
          <PrivacyLink className="hidden sm:inline" />
          <ThemeToggle className="-mx-2" />
          <Link
            href="/builder"
            className="rounded-full bg-foreground px-4 py-2 text-background transition-opacity hover:opacity-85"
          >
            Open editor
          </Link>
        </nav>
      </div>
    </header>
  );
}
