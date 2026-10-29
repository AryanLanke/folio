// "Keep a backup" reminder, shown in the corner after a download
export default function BackupNudge({ onSave, onDismiss }: { onSave: () => void; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-40 rounded-lg border border-border bg-surface p-4 shadow-2xl sm:left-auto sm:right-6 sm:bottom-6 sm:w-96"
    >
      <p className="text-sm font-bold">Keep a backup of your resume</p>
      <p className="mt-1 text-sm text-muted">
        Folio saves your work only in this browser, never on a server. If browser data gets cleared, or you switch
        devices, a backup file brings it all back.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onSave}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
        >
          Save backup file
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full px-4 py-1.5 text-sm font-bold text-muted transition-colors hover:text-foreground"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
