"use client";

import { useLayoutEffect, useRef, useState } from "react";

// A small pill-shaped switch for picking one option out of a few. The highlight slides to the
// option you pick instead of jumping there.
export default function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const labels = options.map((option) => option.label).join("|");

  // Measured before paint, and again whenever the track resizes (fonts loading, a label changing)
  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>('[aria-checked="true"]');
      if (!active) return;
      const next = { left: active.offsetLeft, width: active.offsetWidth };
      setPill((prev) => (prev && prev.left === next.left && prev.width === next.width ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, labels]);

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs font-semibold text-muted">{label}</span>}
      <div ref={track} className="relative flex rounded-full bg-surface p-0.5" role="radiogroup" aria-label={label}>
        {/* Until it's measured (or while hidden), the picked option paints its own highlight */}
        {pill && pill.width > 0 && (
          <span
            aria-hidden
            className="absolute inset-y-0.5 left-0 rounded-full bg-foreground transition-[transform,width] duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
          />
        )}
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`relative rounded-full px-3 py-1 text-xs font-bold transition-colors duration-300 ${
              value === option.value
                ? `text-background ${pill && pill.width > 0 ? "" : "bg-foreground"}`
                : "text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
