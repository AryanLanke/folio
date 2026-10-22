import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { FEEDBACK_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy · Folio",
  description: "What Folio stores, what the AI sees, and what never leaves your device.",
};

const sections = [
  {
    title: "Your resume stays on your device",
    body: [
      "Folio has no accounts and no database. Everything you type is saved in your own browser's storage, on your device. We can't see it, and nobody else can either.",
      "Because of that, clearing your browser data deletes your resumes. Folio asks your browser to keep them, but browsers can still clear storage on their own; Safari, for example, may clear sites you haven't opened in a while. Use More → Save backup file to keep a copy of all your resumes as a file on your device, and More → Open backup file to bring them back, here or on another device.",
    ],
  },
  {
    title: "PDF and Word files are made on your device",
    body: [
      "When you download, the file is generated in your browser. Your resume isn't uploaded anywhere to make it.",
    ],
  },
  {
    title: "AI only sees what you choose to send",
    body: [
      "Nothing is sent to AI unless you click an AI button. When you do, only the text that action needs is sent: the one box you're enhancing, the job posting you paste, the resume you import or ask to score, your messages in the \"Build with AI\" chat, or your resume text when you ask for a cover letter.",
      "Voice typing in the chat uses your browser's own speech recognition. In Chrome and Edge, your browser sends the audio to Google or Microsoft to turn it into text. Folio never receives the audio, only the text you send.",
      "That text goes through Folio's server to our AI provider, Groq, to produce a suggestion, and is sent back to you. Folio doesn't store it or log its contents. Groq's terms say it doesn't train on what it receives; it may keep requests for a limited time for its own security and abuse checks.",
      "An uploaded PDF or Word file is read in memory to get its text, then discarded.",
    ],
  },
  {
    title: "Visitor statistics",
    body: [
      "Folio uses Vercel Web Analytics to count page visits. It doesn't use cookies, doesn't track you across sites, and never sees what you type in the editor.",
    ],
  },
  {
    title: "Questions",
    body: [`Email ${FEEDBACK_EMAIL} with any question about privacy, or to report a bug or suggest an idea.`],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <h1 className="text-4xl font-bold tracking-tight">Privacy</h1>
        <p className="mt-4 text-lg leading-8 text-muted">
          The short version: your resume lives in your browser, AI only sees what you choose to send it, and
          nothing is sold or shared.
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
