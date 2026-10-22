import { contactItems } from "@/lib/links";
import { PAGE_MARGIN, PAPER, type PaperSize, type Resume } from "@/lib/resume";
import { plainText } from "@/lib/rich";
import { HTML_FONT, layoutFor } from "@/lib/templates";

// The cover letter as a page, with a header that matches the resume's template
export default function CoverLetterPreview({ resume, paper }: { resume: Resume; paper: PaperSize }) {
  const { basics } = resume;
  const size = PAPER[paper];
  const { spec, fontSize } = layoutFor(resume.style);
  const contact = contactItems(basics, resume.style.links);
  const paragraphs = resume.coverLetter.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <article
      style={{
        fontFamily: spec.serif ? HTML_FONT.serif : HTML_FONT.sans,
        fontSize: fontSize + 0.5,
        lineHeight: 1.55,
        width: size.width,
        minHeight: size.height,
        padding: PAGE_MARGIN * 1.25,
      }}
      className="bg-white text-neutral-800"
    >
      <header
        style={{
          textAlign: spec.align,
          borderBottom: `${spec.headerRule?.width ?? 1}px solid ${spec.headerRule?.color ?? "#d4d4d4"}`,
          paddingBottom: 12,
        }}
      >
        <h1
          className="leading-tight text-neutral-950"
          style={{
            fontSize: "1.9em",
            fontWeight: spec.name.bold ? 700 : 400,
            textTransform: spec.name.uppercase ? "uppercase" : "none",
            fontFamily: spec.displaySerif ? HTML_FONT.serif : undefined,
          }}
        >
          {plainText(basics.name) || "Your Name"}
        </h1>
        {contact.length > 0 && (
          <p className="mt-1 text-neutral-600">
            {contact.map((item, i) => (
              <span key={i}>
                {i > 0 && <span className="px-2 text-neutral-400">|</span>}
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                    {item.text}
                  </a>
                ) : (
                  item.text
                )}
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="mt-8 space-y-4">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, i) => (
            <p key={i} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-neutral-400">Your cover letter will appear here.</p>
        )}
      </div>
    </article>
  );
}
