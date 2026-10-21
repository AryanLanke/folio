import { PAGE_MARGIN, PAPER, type PaperSize, type Resume, toLines, toList } from "@/lib/resume";

// Single-column, ATS-safe layout: plain text, standard headings, no tables or graphics.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="break-after-avoid border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-900">
        {title}
      </h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

function Dates({ start, end }: { start: string; end: string }) {
  if (!start && !end) return null;
  return (
    <span className="shrink-0 text-neutral-600">
      {start}
      {start && end ? " – " : ""}
      {end}
    </span>
  );
}

function Bullets({ text }: { text: string }) {
  const lines = toLines(text);
  if (lines.length === 0) return null;
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-4">
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}

// Links stay clickable in the downloaded PDF
function WebLink({ text }: { text: string }) {
  const href = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  return <a href={href}>{text}</a>;
}

function Contact({ basics }: { basics: Resume["basics"] }) {
  const items = [
    basics.email && <a key="email" href={`mailto:${basics.email}`}>{basics.email}</a>,
    basics.phone && <span key="phone">{basics.phone}</span>,
    basics.location && <span key="location">{basics.location}</span>,
    basics.link && <WebLink key="link" text={basics.link} />,
  ].filter(Boolean);
  if (items.length === 0) return null;
  return (
    <p className="mt-1.5 text-neutral-600">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="px-2 text-neutral-400">|</span>}
          {item}
        </span>
      ))}
    </p>
  );
}

export default function ResumePreview({
  resume,
  paper,
  mode = "screen",
}: {
  resume: Resume;
  paper: PaperSize;
  // "print" drops the page box, since the printed page's own margins take over
  mode?: "screen" | "print";
}) {
  const { basics, summary, experience, education, projects, skills } = resume;
  const skillList = toList(skills);
  const size = PAPER[paper];

  const hasExperience = experience.some((e) => e.role || e.company || e.bullets);
  const hasEducation = education.some((e) => e.school || e.degree);
  const hasProjects = projects.some((p) => p.name || p.bullets);

  const pageStyle =
    mode === "screen" ? { width: size.width, minHeight: size.height, padding: PAGE_MARGIN } : {};

  return (
    <article
      style={{ fontFamily: "Arial, Helvetica, sans-serif", ...pageStyle }}
      className="bg-white text-[12.5px] leading-[1.45] text-neutral-800"
    >
      <header className="text-center">
        <h1 className="text-[26px] font-bold leading-tight text-neutral-950">
          {basics.name || "Your Name"}
        </h1>
        {basics.title && <p className="mt-0.5 text-[14px] text-neutral-700">{basics.title}</p>}
        <Contact basics={basics} />
      </header>

      {summary.trim() && (
        <Section title="Summary">
          <p>{summary}</p>
        </Section>
      )}

      {hasExperience && (
        <Section title="Experience">
          {experience.map((item) => (
            <div key={item.id} className="break-inside-avoid">
              <div className="flex items-baseline justify-between gap-4">
                <p>
                  <span className="font-bold text-neutral-950">{item.role}</span>
                  {item.role && item.company ? ", " : ""}
                  {item.company}
                  {item.location ? ` — ${item.location}` : ""}
                </p>
                <Dates start={item.start} end={item.end} />
              </div>
              <Bullets text={item.bullets} />
            </div>
          ))}
        </Section>
      )}

      {hasProjects && (
        <Section title="Projects">
          {projects.map((item) => (
            <div key={item.id} className="break-inside-avoid">
              <p>
                <span className="font-bold text-neutral-950">{item.name}</span>
                {item.link && (
                  <>
                    {" — "}
                    <WebLink text={item.link} />
                  </>
                )}
              </p>
              <Bullets text={item.bullets} />
            </div>
          ))}
        </Section>
      )}

      {hasEducation && (
        <Section title="Education">
          {education.map((item) => (
            <div key={item.id} className="break-inside-avoid">
              <div className="flex items-baseline justify-between gap-4">
                <p>
                  <span className="font-bold text-neutral-950">{item.degree}</span>
                  {item.degree && item.school ? ", " : ""}
                  {item.school}
                  {item.location ? ` — ${item.location}` : ""}
                </p>
                <Dates start={item.start} end={item.end} />
              </div>
              {item.details && <p className="mt-0.5">{item.details}</p>}
            </div>
          ))}
        </Section>
      )}

      {skillList.length > 0 && (
        <Section title="Skills">
          <p>{skillList.join(", ")}</p>
        </Section>
      )}
    </article>
  );
}
