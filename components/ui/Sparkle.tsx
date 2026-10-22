// The mark for actions that use AI (and so one of the day's free AI actions). One four-point
// star drawn in the text's own color, so it reads as part of the label, not an emoji on front.
export default function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={`size-[1em] shrink-0 ${className}`}>
      <path d="M12 2.5c.55 4.9 4.6 8.95 9.5 9.5-4.9.55-8.95 4.6-9.5 9.5-.55-4.9-4.6-8.95-9.5-9.5 4.9-.55 8.95-4.6 9.5-9.5Z" />
    </svg>
  );
}
