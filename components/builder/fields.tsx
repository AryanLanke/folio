"use client";

import { useState } from "react";
import Chevron from "@/components/ui/Chevron";
import { hasFormatting, plainText } from "@/lib/rich";

// Building blocks for the editor form

const inputBase =
  "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-faint outline-none transition-colors disabled:opacity-40";

function inputClass(warning?: string | null) {
  return `${inputBase} ${warning ? "border-warning/70 focus:border-warning" : "border-border focus:border-accent"}`;
}

export const smallButton =
  "rounded px-2 py-1 text-xs font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30";

function Warning({ text }: { text?: string | null }) {
  if (!text) return null;
  return <span className="mt-1 block text-xs text-warning">{text}</span>;
}

// The form shows just the words of text formatted on the page, and says that typing here
// would replace the bold, italic or underline
function FormattedNote({ value }: { value: string }) {
  if (!hasFormatting(value)) return null;
  return (
    <span className="mt-1 block text-[11px] text-muted">
      Has bold, italic or underline from the page. Typing here keeps just the words.
    </span>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  warning,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  // Shown under the field; the value is still accepted
  warning?: string | null;
  type?: "text" | "email" | "tel";
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      <input
        type={type}
        className={inputClass(warning)}
        value={plainText(value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={warning ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <Warning text={warning} />
      <FormattedNote value={value} />
    </label>
  );
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-semibold text-muted">
        {label}
        {hint && <span className="font-normal text-muted">{hint}</span>}
      </span>
      <textarea
        className={`${inputClass()} resize-y leading-6`}
        rows={rows}
        value={plainText(value)}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <FormattedNote value={value} />
    </label>
  );
}

// A collapsible editor section; sections that appear on the resume can also be moved
export function Card({
  title,
  move,
  onRemove,
  children,
}: {
  title: string;
  move?: { index: number; count: number; to: (index: number) => void };
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-lg bg-surface">
      <div className="flex items-center gap-2 py-2 pl-5 pr-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
        >
          <Chevron className={`text-sm text-muted transition-transform ${open ? "rotate-90" : ""}`} />
          <h2 className="truncate text-base font-bold">{title || "Untitled section"}</h2>
        </button>
        {move && (
          <div className="flex gap-1">
            <button
              type="button"
              className={smallButton}
              disabled={move.index === 0}
              onClick={() => move.to(move.index - 1)}
              aria-label={`Move ${title} up`}
            >
              ↑
            </button>
            <button
              type="button"
              className={smallButton}
              disabled={move.index === move.count - 1}
              onClick={() => move.to(move.index + 1)}
              aria-label={`Move ${title} down`}
            >
              ↓
            </button>
          </div>
        )}
        {onRemove && (
          <button type="button" className={`${smallButton} hover:text-danger`} onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
      {/* Folds shut smoothly; while shut, its fields can't be tabbed into */}
      <div className="fold" data-closed={!open || undefined} inert={!open}>
        <div>
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function ItemControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-1">
      <button type="button" className={smallButton} disabled={index === 0} onClick={() => onMove(index - 1)}>
        ↑ Up
      </button>
      <button type="button" className={smallButton} disabled={index === count - 1} onClick={() => onMove(index + 1)}>
        ↓ Down
      </button>
      <button type="button" className={`${smallButton} hover:text-danger`} onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

// One entry (a job, a school, ...) inside a section
export function Item({
  label,
  controls,
  children,
}: {
  label: string;
  controls: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold">{label}</span>
        {controls}
      </div>
      {children}
    </div>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md border border-dashed border-border py-2.5 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent-ink"
    >
      + {label}
    </button>
  );
}
