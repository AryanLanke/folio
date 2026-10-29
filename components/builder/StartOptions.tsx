import Sparkle from "@/components/ui/Sparkle";

// Ways to fill the resume without the form, above the editor. On an empty resume they're the
// first thing offered; once there's something written they shrink to one quiet row.
export default function StartOptions({
  blank,
  onChat,
  onImport,
  onOpenBackup,
  onClear,
}: {
  blank: boolean;
  onChat: () => void;
  onImport: () => void;
  onOpenBackup: () => void;
  onClear: () => void;
}) {
  if (blank) {
    return (
      <section className="mb-4 rounded-lg border border-accent/40 bg-accent/5 p-4">
        <p className="text-sm font-bold">Don&apos;t want to fill in forms?</p>
        <p className="text-sm text-muted">
          Tell AI about your work in your own words, or import the resume you already have. Made one here before? Open
          your backup file.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onChat}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
          >
            <Sparkle />
            Build with AI
          </button>
          <button
            type="button"
            onClick={onImport}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-bold transition-colors hover:border-foreground"
          >
            Import resume
          </button>
          <button
            type="button"
            onClick={onOpenBackup}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-bold transition-colors hover:border-foreground"
          >
            Open backup
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="basis-full text-xs font-semibold text-muted sm:mr-auto sm:basis-auto">Changed your mind?</span>
      <button
        type="button"
        onClick={onChat}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-bold transition-colors hover:border-foreground"
      >
        <Sparkle className="text-accent-ink" />
        Build with AI
      </button>
      <button
        type="button"
        onClick={onImport}
        className="rounded-full border border-border px-3 py-1 text-xs font-bold transition-colors hover:border-foreground"
      >
        Import resume
      </button>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted transition-colors hover:border-danger hover:text-danger"
      >
        Clear all
      </button>
    </div>
  );
}
