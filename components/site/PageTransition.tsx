import { ViewTransition } from "react";

// Wraps a whole page so moving to or from it fades instead of cutting (styles in globals.css).
// It plays on every move between pages, the browser's back button included, never on the first
// load. Browsers without view transitions just switch pages.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
