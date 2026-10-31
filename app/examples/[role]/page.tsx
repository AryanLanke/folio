import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ExampleSheet from "@/components/site/ExampleSheet";
import PageTransition from "@/components/site/PageTransition";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { EXAMPLES, findExample } from "@/lib/examples";
import { TEMPLATES } from "@/lib/resume";

// Every example is a static page, built ahead of time
export function generateStaticParams() {
  return EXAMPLES.map((example) => ({ role: example.slug }));
}

export async function generateMetadata({ params }: PageProps<"/examples/[role]">): Promise<Metadata> {
  const example = findExample((await params).role);
  if (!example) return {};
  return {
    title: `${example.role} resume example · Folio`,
    description: `${example.blurb} Free and ATS-friendly: edit it into your own and download a PDF or Word file.`,
  };
}

// The header and footer don't depend on which example it is, so they're outside the Suspense
// boundary that reads the address (Next.js wants address data inside one, so navigating here
// stays instant). Every example is prerendered, so its content is never actually waited on.
export default function ExamplePage({ params }: PageProps<"/examples/[role]">) {
  return (
    <PageTransition>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
          <Suspense>{params.then(({ role }) => <ExampleContent slug={role} />)}</Suspense>
        </main>
        <SiteFooter />
      </div>
    </PageTransition>
  );
}

function ExampleContent({ slug }: { slug: string }) {
  const example = findExample(slug);
  if (!example) notFound();
  const resume = example.resume();
  const useHref = `/builder?example=${example.slug}`;

  return (
    <>
      <Link href="/examples" className="text-sm font-bold text-muted transition-colors hover:text-foreground">
        ← All examples
      </Link>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">{example.role} resume example</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{example.blurb}</p>
      <Link
        href={useHref}
        className="mt-8 inline-flex h-12 items-center rounded-full bg-accent px-8 text-base font-bold text-black transition-colors hover:bg-accent-hover"
      >
        Use this example
      </Link>

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[auto_1fr]">
        <ExampleSheet resume={resume} scaleClass="[--scale:0.38] min-[400px]:[--scale:0.42] sm:[--scale:0.7] lg:[--scale:0.72]" />

        <div className="space-y-8">
          <section className="rounded-lg bg-surface p-6">
            <h2 className="text-lg font-bold">What makes it work</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
              {example.tips.map((tip) => (
                <li key={tip} className="flex gap-3">
                  <span className="font-bold text-accent-ink" aria-hidden>
                    ✓
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg bg-surface p-6">
            <h2 className="text-lg font-bold">Keywords recruiters search for</h2>
            <p className="mt-1 text-sm text-muted">
              Use the ones you really have, in your bullets as well as in Skills.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {example.keywords.map((keyword) => (
                <li key={keyword} className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-ink">
                  {keyword}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-dashed border-border p-6 text-sm leading-6 text-muted">
            <p>
              Shown in the <b className="text-foreground">{TEMPLATES[resume.style.template].label}</b> template, one of
              nine ATS-safe designs. In the editor you can switch templates, check your ATS score and match it to a
              job posting.
            </p>
            <Link
              href={useHref}
              className="mt-3 inline-block font-bold text-accent-ink transition-colors hover:text-accent-ink-hover"
            >
              Open it in the editor →
            </Link>
          </section>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="text-2xl font-bold tracking-tight">More resume examples</h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {EXAMPLES.filter((other) => other.slug !== example.slug).map((other) => (
            <li key={other.slug}>
              <Link
                href={`/examples/${other.slug}`}
                className="inline-block rounded-full border border-border px-4 py-2 text-sm font-bold transition-colors hover:border-foreground"
              >
                {other.role}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
