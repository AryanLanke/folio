"use client";

import { useEffect, useRef } from "react";

export const menuItemClass =
  "block w-full rounded px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40";

// A dropdown that closes when an item is picked or when clicking anywhere else
export default function Menu({
  label,
  buttonClass,
  panelClass = "w-60",
  align = "right",
  className = "",
  onToggle,
  children,
}: {
  label: React.ReactNode;
  buttonClass: string;
  panelClass?: string;
  align?: "left" | "right";
  className?: string;
  // Told when the menu opens or closes, for menus whose contents are costly to draw
  onToggle?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // A wide panel opening near the edge of a narrow window slides back in, so none of it is cut off
  const keepOnScreen = (open: boolean) => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.translate = "";
    if (!open) return;
    const margin = 16;
    const { left, right } = panel.getBoundingClientRect();
    const shift = Math.max(Math.min(0, window.innerWidth - margin - right), margin - left);
    if (shift) panel.style.translate = `${shift}px 0`;
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const menu = ref.current;
      if (menu?.open && !menu.contains(e.target as Node)) menu.open = false;
    };
    // Esc closes it and puts focus back on its button, like any menu
    const onKey = (e: KeyboardEvent) => {
      const menu = ref.current;
      if (e.key !== "Escape" || !menu?.open) return;
      menu.open = false;
      menu.querySelector("summary")?.focus();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details
      ref={ref}
      className={`menu relative ${className}`}
      onToggle={(e) => {
        keepOnScreen(e.currentTarget.open);
        onToggle?.(e.currentTarget.open);
      }}
    >
      <summary className={`cursor-pointer list-none [&::-webkit-details-marker]:hidden ${buttonClass}`}>{label}</summary>
      <div
        ref={panelRef}
        className={`menu-panel absolute z-30 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface p-1.5 shadow-2xl ${
          align === "right" ? "right-0" : "left-0"
        } ${panelClass}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button") && ref.current) ref.current.open = false;
        }}
      >
        {children}
      </div>
    </details>
  );
}

export function MenuDivider() {
  return <div className="my-1 border-t border-border" />;
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1 pt-2 text-xs font-semibold text-muted">{children}</p>;
}
