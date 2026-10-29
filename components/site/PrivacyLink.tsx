"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// True when the privacy page was reached from another Folio page, so going back stays on Folio
function cameFromFolio() {
  // Opened with a link inside Folio, without a full page load: the page that first loaded was another one
  const [first] = performance.getEntriesByType("navigation");
  if (first && new URL(first.name).pathname !== location.pathname) return true;
  try {
    return new URL(document.referrer).origin === location.origin;
  } catch {
    return false;
  }
}

// The Privacy link. On the privacy page it's lit up, and clicking it again goes back to where you
// were, like the browser's Back button (or to the home page if you arrived from somewhere else).
export default function PrivacyLink({ className = "" }: { className?: string }) {
  const router = useRouter();
  const here = usePathname() === "/privacy";

  return (
    <Link
      href="/privacy"
      aria-current={here ? "page" : undefined}
      title={here ? "Go back" : undefined}
      className={`transition-colors hover:text-foreground ${here ? "text-foreground" : "text-muted"} ${className}`}
      onClick={(e) => {
        if (!here) return;
        e.preventDefault();
        if (cameFromFolio()) router.back();
        else router.push("/");
      }}
    >
      Privacy
    </Link>
  );
}
