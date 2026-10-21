const steps = [
  {
    title: "Add your details",
    body: "Fill in your experience, education and skills in a simple form.",
  },
  {
    title: "Pick a layout",
    body: "Choose a clean template that recruiters can read at a glance.",
  },
  {
    title: "Download",
    body: "Export a print-ready PDF and start applying.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-6">
          <span className="text-lg font-bold tracking-tight">
            Short<span className="text-accent">list</span>
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-20 sm:py-28">
        <section className="max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Your resume, done right.
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted">
            Write it once, make it look good, and download it ready to send.
            No sign-up, no clutter.
          </p>
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
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-muted">
          Shortlist
        </div>
      </footer>
    </div>
  );
}
