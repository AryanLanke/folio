import type { Metadata } from "next";
import ClientBuilder from "@/components/builder/ClientBuilder";
import PageTransition from "@/components/site/PageTransition";

export const metadata: Metadata = {
  title: "Editor · Folio",
};

export default function BuilderPage() {
  return (
    <PageTransition>
      <ClientBuilder />
    </PageTransition>
  );
}
