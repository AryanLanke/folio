"use client";

// A short guide to the browser's print window, shown before the first PDF download
export default function PdfTipDialog({ onCancel, onContinue }: { onCancel: () => void; onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-tip-title"
        className="w-full max-w-md rounded-xl bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="pdf-tip-title" className="text-lg font-bold">
          Saving your PDF
        </h2>
        <p className="mt-1 text-sm text-muted">A print window opens next. In it:</p>
        <ol className="mt-4 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="font-bold text-accent">1</span>
            <span>
              Set <b>Destination</b> to <b>Save as PDF</b>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-accent">2</span>
            <span>
              Open <b>More settings</b> and turn off <b>Headers and footers</b>, so the date and web address
              aren&apos;t printed on your resume.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-accent">3</span>
            <span>
              Click <b>Save</b>.
            </span>
          </li>
        </ol>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
          >
            Got it, continue
          </button>
        </div>
      </div>
    </div>
  );
}
