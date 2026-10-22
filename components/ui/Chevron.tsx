// A line-drawn arrow pointing right, in the text's own colour. Phones draw "▶" as an emoji.
export default function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-[1em] shrink-0 ${className}`}
    >
      <path d="m9 5.5 6.5 6.5L9 18.5" />
    </svg>
  );
}
