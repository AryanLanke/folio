import Link from "next/link";

const steps = [
  {
    title: "Add your details",
    body: "Fill in your experience, education and skills. Put the sections in any order you like.",
  },
  {
    title: "Pick a template",
    body: "Choose Classic, Modern or Serif, and see exactly where page one ends as you type.",
  },
  {
    title: "Check and download",
    body: "See what applicant tracking software reads, then save a clean PDF and start applying.",
  },
];

const promises = [
  {
    title: "Free PDF, no watermark",
    body: "No paywall at the download button. Ever.",
  },
  {
    title: "No sign-up",
    body: "Open the editor and start typing. No account, no email.",
  },
  {
    title: "Your data stays with you",
    body: "Your resume is saved in your own browser, not on our servers.",
  },
  {
    title: "Built to pass ATS",
    body: "Single column, real text, standard headings, and a built-in check.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight">
            Folio<span className="text-accent">.</span>
          </span>
          <Link
            href="/builder"
            className="text-sm font-bold text-muted transition-colors hover:text-foreground"
          >
            Open editor
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-20 sm:py-28">
        <section className="max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Your resume, done right.
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted">
            Write it once, make it look good, and download it ready to send. Free, with no sign-up and
            no clutter.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/builder"
              className="inline-flex h-12 items-center rounded-full bg-accent px-8 text-base font-bold text-black transition-colors hover:bg-accent-hover"
            >
              Start building
            </Link>
            <Link
              href="/builder?example"
              className="inline-flex h-12 items-center rounded-full border border-border px-8 text-base font-bold transition-colors hover:border-foreground"
            >
              See an example
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-lg bg-surface p-6 transition-colors hover:bg-surface-hover"
            >
              <span className="text-sm font-bold text-accent">0{i + 1}</span>
              <h2 className="mt-3 text-lg font-bold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight">What you won&apos;t find here</h2>
          <p className="mt-2 text-muted">
            Most resume builders let you write for free, then charge you to download. Folio doesn&apos;t.
          </p>
          <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {promises.map((promise) => (
              <div key={promise.title} className="flex gap-3">
                <span className="mt-0.5 font-bold text-accent" aria-hidden>
                  ✓
                </span>
                <div>
                  <h3 className="font-bold">{promise.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{promise.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl justify-between gap-4 px-6 py-6 text-sm text-muted">
          <span>Folio</span>
          <a
            href="https://github.com/AryanLanke/resume-builder"
            className="transition-colors hover:text-foreground"
          >
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
