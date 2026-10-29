import { useLayoutEffect, useRef, useState } from "react";
import Editable, { type LineKeys, placeCaret } from "@/components/resume/Editable";
import { markProps } from "@/components/resume/page/fields";
import { toLines } from "@/lib/resume";
import { plainText } from "@/lib/rich";

// One bullet per line, edited like a list in Word: Enter splits a bullet (or starts a new one),
// Backspace at the start joins it to the one above, Alt+Up and Alt+Down move it. Editing a
// bullet to nothing removes it.
export default function Bullets({
  value,
  onCommit,
  marked,
}: {
  value: string;
  onCommit?: (next: string) => void;
  // Lines Optimize changed (by line number), with what each said before
  marked?: Record<number, string>;
}) {
  const lines = toLines(value);
  const listRef = useRef<HTMLUListElement>(null);
  // A new empty bullet from Enter: it only becomes part of the resume once something is typed
  const [pending, setPending] = useState<number | null>(null);
  // Where the cursor goes once the list has re-rendered
  const focusNext = useRef<{ index: number; offset: number | "end" } | null>(null);

  useLayoutEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    const element = listRef.current?.querySelectorAll<HTMLElement>("[role=textbox]")[target.index];
    if (element) placeCaret(element, target.offset);
  });

  if (lines.length === 0) return null;
  const shown = pending !== null && pending <= lines.length ? [...lines.slice(0, pending), "", ...lines.slice(pending)] : lines;
  // Saves the list as shown; an empty line left in it stays on screen as the new bullet
  const save = (next: string[], empty: number | null = null) => {
    setPending(empty);
    const filled = next.filter((line) => plainText(line).trim());
    if (filled.join("\n") !== lines.join("\n")) onCommit?.(filled.join("\n"));
  };

  const commitLine = (i: number) =>
    onCommit &&
    ((next: string) => {
      const copy = [...shown];
      copy[i] = next;
      save(copy);
    });

  const keys = (i: number): LineKeys => ({
    onSplit: (before, after) => {
      const empty = (text: string) => !plainText(text).trim();
      if (empty(before) && empty(after)) {
        // Enter on an empty bullet ends the list, like in Word
        setPending(null);
        return false;
      }
      const copy = [...shown];
      copy.splice(i, 1, before, after);
      focusNext.current = { index: i + 1, offset: 0 };
      save(copy, empty(after) ? i + 1 : empty(before) ? i : null);
      return true;
    },
    onMergeUp: (current) => {
      if (i === 0) return false;
      const copy = [...shown];
      const previous = copy[i - 1];
      const space = plainText(previous).trim() && plainText(current).trim() ? " " : "";
      copy.splice(i - 1, 2, previous + space + current);
      focusNext.current = { index: i - 1, offset: plainText(previous).length + space.length };
      save(copy);
      return true;
    },
    onMove: (direction, current) => {
      const to = i + direction;
      if (to < 0 || to >= shown.length) return false;
      const copy = [...shown];
      copy[i] = copy[to];
      copy[to] = current;
      focusNext.current = { index: to, offset: "end" };
      save(copy, pending === i ? to : pending === to ? i : pending);
      return true;
    },
  });

  return (
    <ul ref={listRef} className="mt-1 list-disc space-y-0.5 pl-4">
      {shown.map((line, i) => (
        <li key={i}>
          <Editable
            value={line}
            label="Bullet point"
            onCommit={commitLine(i)}
            lineKeys={onCommit && keys(i)}
            {...markProps(marked?.[i])}
          />
        </li>
      ))}
    </ul>
  );
}
