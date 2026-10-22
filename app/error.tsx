"use client";

import ErrorScreen from "@/components/site/ErrorScreen";

// Catches unexpected errors on any page, inside the normal layout
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} />;
}
