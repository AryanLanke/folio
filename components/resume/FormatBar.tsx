"use client";

import { useEffect, useState } from "react";

const COMMANDS = [
  { command: "bold", label: "Bold", shortcut: "Ctrl+B", icon: <span className="font-black">B</span> },
  { command: "italic", label: "Italic", shortcut: "Ctrl+I", icon: <span className="font-serif text-[15px] italic">I</span> },
  { command: "underline", label: "Underline", shortcut: "Ctrl+U", icon: <span className="underline underline-offset-2">U</span> },
] as const;

type Command = (typeof COMMANDS)[number]["command"];

// Bold, italic and underline for text selected on the page, like Word's toolbar. The buttons
// don't take focus when pressed, so the selection on the page stays where it is.
export default function FormatBar() {
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useState<Partial<Record<Command, boolean>>>({});

  useEffect(() => {
    const update = () => {
      const element = document.activeElement as HTMLElement | null;
      const onPage = Boolean(element?.isContentEditable);
      setEditing(onPage);
      setActive(onPage ? Object.fromEntries(COMMANDS.map(({ command }) => [command, document.queryCommandState(command)])) : {});
    };
    document.addEventListener("selectionchange", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      document.removeEventListener("selectionchange", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);

  // A row of its own, so the note appearing while editing never pushes the other controls around
  return (
    <div className="flex w-full items-center gap-2">
      <span className="text-xs font-semibold text-muted">Format</span>
      <div className="flex rounded-full bg-surface p-0.5">
        {COMMANDS.map(({ command, label, shortcut, icon }) => (
          <button
            key={command}
            type="button"
            aria-label={label}
            aria-pressed={Boolean(active[command])}
            title={editing ? `${label} (${shortcut})` : `${label}: click text on the page first`}
            disabled={!editing}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => document.execCommand(command)}
            className={`grid size-7 place-items-center rounded-full text-sm transition-colors disabled:opacity-40 ${
              active[command] ? "bg-foreground text-background" : "text-muted hover:text-foreground"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
      {editing && (
        <span className="text-xs text-muted">Shows in your PDF and Word file. Screening software reads just the words.</span>
      )}
    </div>
  );
}
