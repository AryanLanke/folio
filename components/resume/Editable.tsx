"use client";

import { useLayoutEffect, useRef } from "react";

// Whether this browser can edit text without allowing formatting (bold, pasted styles, ...)
let plainTextOnly: boolean | null = null;
function editMode() {
  if (plainTextOnly === null) {
    const probe = document.createElement("div");
    probe.contentEditable = "plaintext-only";
    plainTextOnly = probe.contentEditable === "plaintext-only";
  }
  return plainTextOnly ? "plaintext-only" : "true";
}

// One piece of text on the resume page that can be clicked and typed into, like a Word document.
// Enter or clicking away saves, Escape puts it back. The text is set directly on the element
// (not as React children), so React never fights with what the person is typing.
export default function Editable({
  value,
  onCommit,
  label,
  as: Tag = "span",
  className = "",
  style,
}: {
  value: string;
  // Without it, the text is shown normally and can't be edited
  onCommit?: (next: string) => void;
  // What this is, for screen readers ("Job title", "Bullet point")
  label: string;
  as?: "span" | "p" | "h1";
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  // Show the latest value, but never while it's being edited
  useLayoutEffect(() => {
    const element = ref.current;
    if (element && document.activeElement !== element && element.textContent !== value) element.textContent = value;
  }, [value]);

  if (!onCommit) {
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }

  const commit = () => {
    const element = ref.current;
    if (!element) return;
    const next = (element.textContent ?? "").replace(/\s+/g, " ").trim();
    if (next === value.trim()) {
      element.textContent = value;
      return;
    }
    onCommit(next);
  };

  return (
    <Tag
      ref={ref as React.Ref<never>}
      contentEditable={editMode()}
      suppressContentEditableWarning
      role="textbox"
      aria-label={label}
      title="Click to edit"
      spellCheck
      className={`cursor-text rounded-sm outline-none transition-colors hover:bg-amber-100/70 focus:bg-amber-100 ${className}`}
      style={style}
      onBlur={commit}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        const element = e.currentTarget;
        if (e.key === "Enter") {
          e.preventDefault();
          element.blur();
        } else if (e.key === "Escape") {
          element.textContent = value;
          element.blur();
        }
      }}
      // Pasted text arrives as plain text, on one line
      onPaste={(e: React.ClipboardEvent<HTMLElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain").replace(/\s+/g, " ");
        if (!document.execCommand("insertText", false, text)) e.currentTarget.textContent += text;
      }}
    />
  );
}
