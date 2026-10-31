import type { Metadata } from "next";
import Link from "next/link";
import ExampleSheet from "@/components/site/ExampleSheet";
import PageTransition from "@/components/site/PageTransition";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { EXAMPLES } from "@/lib/examples";

export const metadata: Metadata = {
  title: "Resume examples by job · Folio",
  description:
    "Free resume examples for software engineers, nurses, teachers, students and more. Every one is ATS-friendly, and you can edit it into your own in Folio.",
};

export default function ExamplesPage() {
  return (
    <PageTransition>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-20">
          <h1 className="text-4xl font-bold tracking-tight">Resume examples by job</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
            Real-looking resumes for common jobs, each with tips on what recruiters look for. Open one in the editor,
            swap in your own details, and download it free.
          </p>

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLES.map((example) => (
              // The title is the link, stretched over the whole card. Wrapping the card in a link
              // would put the page's own contact links inside it, which HTML doesn't allow.
              <li key={example.slug} className="group relative rounded-lg bg-surface p-5 transition-colors hover:bg-surface-hover">
                <ExampleSheet
                  resume={example.resume()}
                  scaleClass="mx-auto [--scale:0.32] sm:[--scale:0.29] md:[--scale:0.36] lg:[--scale:0.38]"
                  crop={0.55}
                />
                <h2 className="mt-4 text-lg font-bold group-hover:text-accent-ink">
                  <Link href={`/examples/${example.slug}`} className="after:absolute after:inset-0 after:rounded-lg">
                    {example.role} resume
                  </Link>
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">{example.blurb}</p>
              </li>
            ))}
          </ul>
        </main>
        <SiteFooter />
      </div>
    </PageTransition>
  );
}
