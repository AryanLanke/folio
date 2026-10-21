import type { Metadata } from "next";
import ClientBuilder from "@/components/builder/ClientBuilder";

export const metadata: Metadata = {
  title: "Editor · Folio",
};

export default function BuilderPage() {
  return <ClientBuilder />;
}
