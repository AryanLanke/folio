import { ViewTransition } from "react";

// Wraps a whole page so moving to or from it fades instead of cutting (styles in
// app/styles/motion.css). It plays when Folio's own links move between pages, never on the first
// load. React skips it for the browser's Back and Forward buttons, so those switch at once, as do
// browsers without view transitions.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
