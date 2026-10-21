"use client";

import dynamic from "next/dynamic";

// The builder reads the saved resume from browser storage, so it only renders in the browser
const Builder = dynamic(() => import("@/components/builder/Builder"), {
  ssr: false,
  loading: () => <div className="h-dvh" />,
});

export default function ClientBuilder() {
  return <Builder />;
}
