"use client";

import { saveTheme } from "@/lib/storage";

// Flips between dark (the default) and light mode, and keeps the choice for this visit. The
// page cross-fades from one to the other (timing in globals.css); browsers without view
// transitions, and people who ask for less motion, get the change at once.
export function switchTheme() {
  const light = document.documentElement.dataset.theme !== "light";
  const apply = () => {
    if (light) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
  };
  saveTheme(light ? "light" : "dark");
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) apply();
  else document.startViewTransition(apply);
}

// A line-drawn sun in dark mode (to switch to light) and moon in light mode. Which one shows is
// decided by CSS, so the page's first paint already has the right one.
function ThemeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-[1.15em] shrink-0 ${className}`}
    >
      <g className="light:hidden">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.46 5.46l1.41 1.41M17.13 17.13l1.41 1.41M5.46 18.54l1.41-1.41M17.13 6.87l1.41-1.41" />
      </g>
      <path className="hidden light:inline" d="M20.25 14.5A8.25 8.25 0 0 1 9.5 3.75a8.25 8.25 0 1 0 10.75 10.75Z" />
    </svg>
  );
}

// The words for the switch in each mode, for menus and screen readers
export function ThemeLabel() {
  return (
    <>
      <span className="light:hidden">Light mode</span>
      <span className="hidden light:inline">Dark mode</span>
    </>
  );
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={switchTheme}
      title="Switch between light and dark mode"
      className={`grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground ${className}`}
    >
      <ThemeIcon className="text-lg" />
      <span className="sr-only">
        <ThemeLabel />
      </span>
    </button>
  );
}
