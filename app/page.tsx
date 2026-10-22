import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";

const features = [
  {
    title: "Build with AI",
    body: "Type or speak about your work in your own words. AI asks a few questions and writes the resume, using only what you said.",
  },
  {
    title: "Score your resume",
    body: "Get a score out of 100 with every point explained: what's working, what's missing, and how to fix it.",
  },
  {
    title: "Match it to the job",
    body: "Paste a job posting and see your match score, the keywords you already cover, and the ones you're missing.",
  },
  {
    title: "Import your old resume",
    body: "Upload a PDF or Word file, or paste the text. Every field fills in, in your own words.",
  },
  {
    title: "AI that doesn't make things up",
    body: "✨ Enhance fixes grammar and wording, then make it shorter, more formal, simpler or more impactful. It never adds facts you didn't write.",
  },
  {
    title: "Five ATS-safe templates",
    body: "Classic, Modern, Executive, Compact and Serif. All built so applicant tracking systems, the software companies use to screen resumes, can read them.",
  },
  {
    title: "A strict ATS check",
    body: "An ATS score out of 100 from 15 checks, like education, bullet formatting, dates, your summary, action verbs and numbers. Each one passes, warns or needs fixing, with how to fix it, and broken bullets fix in one click. Plus the exact text software like Workday reads from your PDF.",
  },
  {
    title: "PDF, Word and cover letters",
    body: "One-click PDF or Word download, plus a cover letter written from your real experience.",
  },
];

const comparison = [
  ["Downloading your resume", "Free PDF and Word, no watermark", "Usually paid, or watermarked"],
  ["Getting started", "No account. Just start typing", "Sign-up required"],
  ["Job match and keywords", "Free", "Paid plans"],
  ["Resume score", "Free, with every point explained", "Paid, or a number with no reasons"],
  ["AI writing help", "Free daily, never invents facts", "Paid, and known to inflate claims"],
  ["Where your resume lives", "In your own browser", "On their servers"],
];

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes. Writing, all five templates, PDF and Word downloads, the ATS check, job match and multiple resumes are free, with no trial and no watermark. AI actions are free up to 15 a day.",
  },
  {
    q: "What is an ATS?",
    a: "An applicant tracking system (ATS) is software most companies use to collect job applications. When you apply online, it reads your resume as plain text, pulls out your name, jobs, dates and skills, and lets recruiters search and rank candidates, often before a person opens your resume. Workday, Greenhouse, Lever and Taleo are common ones.",
  },
  {
    q: "Will my resume get through applicant tracking systems?",
    a: "Every template is built the way ATS software reads best: one column, real selectable text, standard section headings, and no tables, icons or images. The ATS check tab shows you exactly what the software will read.",
  },
  {
    q: "How is the resume score worked out?",
    a: "From checks you can see. Most of it is the ATS check: whether screening software can read your contact details, education, dates and bullets, and whether your summary, verbs, numbers and bullet length will rank well. Then writing style (no buzzwords or \"I\"), and, if you add a job posting, how well you match its keywords. The checks that matter most count most, so a resume with real gaps can't get full marks, and every point comes with what to fix.",
  },
  {
    q: "Does the AI make things up?",
    a: "It's instructed not to, and checked for it: AI only rewords what you wrote, and cover letters go through a separate fact-check against your resume. Still, read everything before you send it.",
  },
  {
    q: "Where is my data stored?",
    a: "In your own browser, on your device. Folio has no accounts and no database. Text you choose to send to AI is processed and not stored. See the privacy page for details.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. The editor switches to Edit and Preview tabs on small screens, and downloads work on phones too.",
  },
  {
    q: "How do I move my resume to another computer?",
    a: "Use More → Save backup file, then More → Open backup file on the other device.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        <section className="max-w-3xl pt-20 sm:pt-28">
          <p className="text-sm font-bold text-accent">Free resume builder · no sign-up · no watermark</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            The resume builder that&apos;s actually free.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Write your resume, match it to the job, polish it with honest AI, and download a PDF or Word file.
            No account, no paywall at the download button.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/builder"
              className="inline-flex h-12 items-center rounded-full bg-accent px-8 text-base font-bold text-black transition-colors hover:bg-accent-hover"
            >
              Start building
            </Link>
            <Link
              href="/builder?chat"
              className="inline-flex h-12 items-center rounded-full border border-border px-6 text-base font-bold transition-colors hover:border-foreground"
            >
              ✨ Build with AI
            </Link>
            <Link
              href="/builder?score"
              className="inline-flex h-12 items-center rounded-full border border-border px-6 text-base font-bold transition-colors hover:border-foreground"
            >
              Score my resume
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">
            Already have a resume? Upload your PDF or Word file to score it, then fix it here.
          </p>
        </section>

        <div className="mt-16 overflow-hidden rounded-xl border border-border shadow-2xl">
          <Image
            src="/screenshots/editor.png"
            alt="The Folio editor: a form on the left and the resume on a real page on the right"
            width={1440}
            height={900}
            priority
            className="h-auto w-full"
          />
        </div>

        <section className="mt-24">
          <h2 className="text-3xl font-bold tracking-tight">Everything the paid builders charge for</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg bg-surface p-6 transition-colors hover:bg-surface-hover">
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Know your match before you apply</h2>
            <p className="mt-4 leading-7 text-muted">
              Paste the job posting. Folio picks out the skills and terms recruiters will search for, scores your
              resume against them as you type, and tailors ✨ Enhance to the job&apos;s wording, without adding
              anything you haven&apos;t done.
            </p>
            <Link
              href="/builder?example&view=job"
              className="mt-6 inline-block font-bold text-accent transition-colors hover:text-accent-hover"
            >
              Try job match on the example →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border shadow-2xl">
            <Image
              src="/screenshots/job-match.png"
              alt="Job match: a 75% score, missing keywords GraphQL and Jest, and the keywords already on the resume"
              width={1440}
              height={900}
              className="h-auto w-full"
            />
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-3xl font-bold tracking-tight">Folio vs. most resume builders</h2>
          <div className="mt-8 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="p-4 font-semibold text-muted" />
                  <th className="p-4 font-bold text-accent">Folio</th>
                  <th className="p-4 font-semibold text-muted">Most resume builders</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(([label, folio, others]) => (
                  <tr key={label} className="border-t border-border">
                    <td className="p-4 font-semibold">{label}</td>
                    <td className="p-4">✓ {folio}</td>
                    <td className="p-4 text-muted">{others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-24 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-7 text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="my-24 rounded-xl bg-surface p-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Your next resume, done right.</h2>
          <p className="mt-3 text-muted">Free, private, and ready in minutes.</p>
          <Link
            href="/builder"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-accent px-8 text-base font-bold text-black transition-colors hover:bg-accent-hover"
          >
            Start building
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
