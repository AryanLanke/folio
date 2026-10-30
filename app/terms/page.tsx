import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { DAILY_LIMIT } from "@/lib/enhance";
import { FEEDBACK_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use · Folio",
  description: "The plain-language rules for using Folio: free, as it is, and your resume stays yours.",
};

// Plain-language terms, laid out like the privacy page
const sections = [
  {
    title: "Folio is free, and provided as it is",
    body: [
      "You can use Folio without paying and without an account. We work to keep it running and correct, but we can't promise it will always be available, error-free, or right for your situation. Use it at your own judgement; we aren't responsible for losses that come from using it.",
    ],
  },
  {
    title: "Your resume is yours",
    body: [
      "Everything you write in Folio belongs to you. It's saved in your own browser, not on our servers, so keeping a copy is up to you: use More → Save backup file now and then. If your browser's storage is cleared, we can't bring your resumes back.",
    ],
  },
  {
    title: "Check what the AI writes",
    body: [
      "AI suggestions are built to reword only what you wrote, but AI can still get things wrong. Read every suggestion before you use it. You're responsible for making sure your resume and cover letters are true.",
    ],
  },
  {
    title: "Fair use of AI",
    body: [
      `Each browser gets ${DAILY_LIMIT} free AI actions a day. Please don't try to get around the limit, automate requests, or use Folio's AI for anything other than your own resume and cover letters. We may block traffic that looks like abuse so the free AI keeps working for everyone.`,
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update Folio and these terms. If the terms change in a way that matters, the new version will be on this page.",
    ],
  },
  {
    title: "Questions",
    body: [`Email ${FEEDBACK_EMAIL} with any question about these terms.`],
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <h1 className="text-4xl font-bold tracking-tight">Terms of use</h1>
        <p className="mt-4 text-lg leading-8 text-muted">
          The short version: Folio is free, your resume stays yours, and you should check anything the AI
          writes before you send it.
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="mt-3 leading-7 text-muted">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <Link
          href="/builder"
          className="mt-14 inline-flex h-12 items-center rounded-full bg-accent px-8 text-base font-bold text-black transition-colors hover:bg-accent-hover"
        >
          Start building
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
