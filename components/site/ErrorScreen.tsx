"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { backupFileName, makeBackup } from "@/lib/backup";
import { reportError } from "@/lib/client/report";
import { saveBlob } from "@/lib/export/text";
import { FEEDBACK_URL } from "@/lib/site";
import { loadLibrary, loadResume, markBackedUp } from "@/lib/storage";

// Saves every resume in this browser as a backup file. Returns false when there's nothing saved.
function saveEverything() {
  try {
    const library = loadLibrary();
    const entries = (library?.items ?? []).flatMap((item) => {
      const resume = loadResume(item.id);
      return resume ? [{ name: item.name, resume }] : [];
    });
    if (entries.length === 0) return false;
    saveBlob(new Blob([makeBackup(entries)], { type: "application/json" }), backupFileName());
    markBackedUp();
    return true;
  } catch {
    return false;
  }
}

// Shown instead of a blank screen if something breaks while a page is open. Resumes live only in
// the browser, so alongside trying again it offers a way to save them as a file first.
export default function ErrorScreen({ error, retry }: { error: unknown; retry: () => void }) {
  const [backup, setBackup] = useState<"idle" | "saved" | "none">("idle");

  // React catches the error to show this screen, so it has to be reported to Sentry by hand
  useEffect(() => {
    console.error(error);
    reportError(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-3 leading-7 text-muted">
        Folio hit an unexpected problem. Your resumes are still saved in this browser. Try again, and if you&apos;d
        like to be safe first, save a backup of them.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => setBackup(saveEverything() ? "saved" : "none")}
          className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-bold transition-colors hover:border-foreground"
        >
          Save a backup of my resumes
        </button>
      </div>
      {backup === "saved" && (
        <p className="mt-4 text-sm text-accent-ink">Saved. Open it later from More → Open backup file.</p>
      )}
      {backup === "none" && <p className="mt-4 text-sm text-muted">There are no saved resumes in this browser yet.</p>}
      <p className="mt-10 text-sm text-muted">
        Keeps happening?{" "}
        <a href={FEEDBACK_URL} className="font-bold text-foreground underline-offset-4 hover:underline">
          Tell us what you were doing
        </a>{" "}
        and we&apos;ll fix it. Or{" "}
        <Link href="/" className="font-bold text-foreground underline-offset-4 hover:underline">
          go to the home page
        </Link>
        .
      </p>
    </main>
  );
}
