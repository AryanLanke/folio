"use client";

import dynamic from "next/dynamic";
import { ViewTransition } from "react";

// The builder reads the saved resume from browser storage, so it only renders in the browser. Once
// its code has loaded it fades in over the blank placeholder, instead of popping in (at once for
// people who turn animations off).
const Builder = dynamic(
  () =>
    import("@/components/builder/Builder").then(({ default: Loaded }) => {
      const FadeIn = () =>
        matchMedia("(prefers-reduced-motion: reduce)").matches ? (
          <Loaded />
        ) : (
          <ViewTransition enter="page-in" default="none">
            <Loaded />
          </ViewTransition>
        );
      return FadeIn;
    }),
  {
    ssr: false,
    loading: () => <div className="h-dvh" />,
  },
);

export default function ClientBuilder() {
  return <Builder />;
}
