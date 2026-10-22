"use client";

import ErrorScreen from "@/components/site/ErrorScreen";
import "./globals.css";

// Catches errors in the root layout itself, so it brings its own page and styles
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <title>Something went wrong · Folio</title>
        <ErrorScreen error={error} retry={retry} />
      </body>
    </html>
  );
}
