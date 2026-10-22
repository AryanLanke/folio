// A line-drawn microphone in the text's own colour; filled in while it's listening
export default function MicIcon({ active = false, className = "" }: { active?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-[1em] shrink-0 ${className}`}
    >
      <rect x="9" y="2.75" width="6" height="11.5" rx="3" fill={active ? "currentColor" : "none"} />
      <path d="M5.75 11a6.25 6.25 0 0 0 12.5 0" />
      <path d="M12 17.25v3.5" />
    </svg>
  );
}
