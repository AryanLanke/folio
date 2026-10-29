"use client";

import { useEffect, useRef } from "react";
import Menu from "@/components/ui/Menu";
import { ACCENT_COLORS, tooLight } from "@/lib/templates";

// The browser's own colour picker, which reports the colour once it closes (not on every drag,
// which would make every shade its own undo step)
function CustomColor({ value, selected, onChange }: { value: string; selected: boolean; onChange: (color: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    const onPicked = () => latest.current(input.value);
    input.addEventListener("change", onPicked);
    return () => input.removeEventListener("change", onPicked);
  }, []);

  return (
    <label
      title="Custom colour"
      className={`relative grid size-5 cursor-pointer place-items-center rounded-full transition-transform hover:scale-110 ${
        selected ? "outline-2 outline-offset-2 outline-foreground" : ""
      }`}
      style={{ background: "conic-gradient(#e11d48, #f59e0b, #16a34a, #0ea5e9, #6366f1, #c026d3, #e11d48)" }}
    >
      {selected && <span className="size-2.5 rounded-full ring-2 ring-white" style={{ background: value }} />}
      <input ref={ref} type="color" defaultValue={value} aria-label="Custom colour" className="absolute size-full cursor-pointer opacity-0" />
    </label>
  );
}

// Round swatches for the heading colour. `fallback` is the template's own colour, which the
// first swatch (an outlined dot) stands for.
export function ColorSwatches({
  value,
  fallback,
  onChange,
}: {
  value: string | null;
  fallback: string;
  onChange: (color: string | null) => void;
}) {
  const custom = value !== null && !ACCENT_COLORS.some((color) => color.value === value);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Heading colour">
        {ACCENT_COLORS.map((color) => {
          const selected = color.value === value;
          return (
            <button
              key={color.label}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={color.label}
              title={color.label}
              onClick={() => onChange(color.value)}
              className={`grid size-5 place-items-center rounded-full transition-transform hover:scale-110 ${
                selected ? "outline-2 outline-offset-2 outline-foreground" : ""
              }`}
              style={
                color.value
                  ? { background: color.value, boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.12)" }
                  : { boxShadow: `inset 0 0 0 2px ${fallback}`, background: "#fff" }
              }
            >
              {!color.value && <span className="size-2 rounded-full" style={{ background: fallback }} />}
            </button>
          );
        })}
        <CustomColor value={custom ? value : fallback} selected={custom} onChange={onChange} />
      </div>
      {value && tooLight(value) && (
        <p className="mt-2 text-xs text-warning">Light colours can be hard to read, especially when printed.</p>
      )}
    </div>
  );
}

// A small round dot beside a heading on the page; clicking it opens the colour swatches
export function ColorDot({
  color,
  value,
  fallback,
  onChange,
}: {
  color: string;
  value: string | null;
  fallback: string;
  onChange: (color: string | null) => void;
}) {
  return (
    <Menu
      align="right"
      className="group/dot"
      panelClass="w-max p-3"
      buttonClass="grid size-5 place-items-center rounded-full opacity-60 transition hover:scale-110 hover:opacity-100 focus-visible:opacity-100 group-open/dot:opacity-100"
      label={
        <>
          <span className="size-3 rounded-full ring-2 ring-white" style={{ background: color, boxShadow: "0 0 0 3px rgb(0 0 0 / 0.12)" }} />
          <span className="sr-only">Change heading colour</span>
        </>
      }
    >
      <p className="mb-2.5 text-xs font-semibold text-muted">Heading colour</p>
      <ColorSwatches value={value} fallback={fallback} onChange={onChange} />
    </Menu>
  );
}
