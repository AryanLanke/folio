"use client";

import { useLayoutEffect, useRef } from "react";
import { nodeToRich, parseRich, richToHtml, toRich } from "@/lib/rich";

// One piece of text on the resume page that can be clicked and typed into, like a Word document,
// including bold, italic and underline (Ctrl+B, Ctrl+I, Ctrl+U or the format buttons). Enter or
// clicking away saves, Escape puts it back. The text is set directly on the element (not as React
// children), so React never fights with what the person is typing.

// Bullets also split with Enter, join the one above with Backspace at the start, and move with
// Alt+Up and Alt+Down. Each gets the text as it is on screen, so nothing typed is lost, and says
// whether it did anything (the first bullet can't join or move up).
export type LineKeys = {
  onSplit: (before: string, after: string) => boolean;
  onMergeUp: (text: string) => boolean;
  onMove: (direction: -1 | 1, text: string) => boolean;
};

// The same text however its tags were written, so an unchanged field doesn't count as an edit
const normalize = (text: string) => toRich(parseRich(text.trim()));

// Puts the cursor `offset` characters into the element's text, or at the end
export function placeCaret(element: HTMLElement, offset: number | "end") {
  element.focus();
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  if (offset === "end") {
    range.selectNodeContents(element);
    range.collapse(false);
  } else {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let left = offset;
    let node = walker.nextNode();
    range.setStart(element, 0);
    while (node) {
      const length = node.textContent?.length ?? 0;
      if (left <= length) {
        range.setStart(node, left);
        break;
      }
      left -= length;
      node = walker.nextNode();
    }
    range.collapse(true);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}

// The text before and after the cursor (a selection is deleted first, as typing would)
function splitAtCaret(element: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!element.contains(range.startContainer)) return null;
  range.deleteContents();
  const before = document.createRange();
  before.selectNodeContents(element);
  before.setEnd(range.startContainer, range.startOffset);
  const after = document.createRange();
  after.selectNodeContents(element);
  after.setStart(range.endContainer, range.endOffset);
  return { before: nodeToRich(before.cloneContents()), after: nodeToRich(after.cloneContents()) };
}

function caretAtStart(element: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  const before = document.createRange();
  before.selectNodeContents(element);
  before.setEnd(range.startContainer, range.startOffset);
  return before.toString() === "";
}

export default function Editable({
  value,
  onCommit,
  label,
  as: Tag = "span",
  className = "",
  style,
  lineKeys,
  hint = "Click to edit",
}: {
  value: string;
  // Without it, the text is shown normally and can't be edited
  onCommit?: (next: string) => void;
  // What this is, for screen readers ("Job title", "Bullet point")
  label: string;
  as?: "span" | "p" | "h1";
  className?: string;
  style?: React.CSSProperties;
  lineKeys?: LineKeys;
  // The tooltip, like what a line said before Optimize changed it
  hint?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const latest = useRef(value);
  // Set when the list itself handles leaving this field (split, join, move), so blurring doesn't save
  const handled = useRef(false);

  // Show the latest value, but never while it's being edited
  useLayoutEffect(() => {
    latest.current = value;
    const element = ref.current;
    if (!element || document.activeElement === element) return;
    const html = richToHtml(value);
    if (element.innerHTML !== html) element.innerHTML = html;
  }, [value]);

  if (!onCommit) {
    return (
      <Tag className={className} style={style}>
        {parseRich(value).map((span, i) => (
          <span
            key={i}
            style={{
              fontWeight: span.bold ? 700 : undefined,
              fontStyle: span.italic ? "italic" : undefined,
              textDecoration: span.underline ? "underline" : undefined,
            }}
          >
            {span.text}
          </span>
        ))}
      </Tag>
    );
  }

  const commit = () => {
    const element = ref.current;
    if (!element) return;
    if (handled.current) {
      handled.current = false;
      element.innerHTML = richToHtml(latest.current);
      return;
    }
    const next = nodeToRich(element);
    if (next === normalize(value)) {
      element.innerHTML = richToHtml(value);
      return;
    }
    onCommit(next);
  };

  return (
    <Tag
      ref={ref as React.Ref<never>}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={label}
      title={hint}
      spellCheck
      className={`cursor-text rounded-sm outline-none transition-colors hover:bg-amber-100/70 focus:bg-amber-100 ${className}`}
      style={style}
      onBlur={commit}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        const element = e.currentTarget;
        if (e.key === "Enter") {
          e.preventDefault();
          const parts = lineKeys && splitAtCaret(element);
          if (!lineKeys || !parts) return element.blur();
          // The list re-renders after this handler, so the flag is in place before focus moves
          if (lineKeys.onSplit(parts.before, parts.after)) handled.current = true;
          else element.blur();
        } else if (e.key === "Backspace" && lineKeys && caretAtStart(element)) {
          if (lineKeys.onMergeUp(nodeToRich(element))) {
            e.preventDefault();
            handled.current = true;
          }
        } else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown") && lineKeys) {
          e.preventDefault();
          if (lineKeys.onMove(e.key === "ArrowUp" ? -1 : 1, nodeToRich(element))) handled.current = true;
        } else if (e.key === "Escape") {
          element.innerHTML = richToHtml(value);
          element.blur();
        }
      }}
      // Pasted text arrives as plain text, on one line
      onPaste={(e: React.ClipboardEvent<HTMLElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain").replace(/\s+/g, " ");
        if (!document.execCommand("insertText", false, text)) e.currentTarget.textContent += text;
      }}
      onDrop={(e: React.DragEvent<HTMLElement>) => e.preventDefault()}
    />
  );
}
