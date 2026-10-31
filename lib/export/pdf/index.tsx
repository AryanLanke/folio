// A real text PDF, drawn from the same template description as the on-screen preview.
// Standard PDF fonts keep the text selectable and readable by ATS software.
//
// shared.tsx    units, layout and the small pieces (formatted text, headings, bullets)
// header.tsx    name, title and contact line
// sections.tsx  every section of the resume

import { Document, Page, Text, View, pdf } from "@react-pdf/renderer";
import { pdfSafe } from "@/lib/export/text";
import { type PaperSize, type Resume, visibleSections } from "@/lib/resume";
import { plainText } from "@/lib/rich";
import { Heading, layout, MARGIN, nameText, PAGE_SIZE, PX } from "@/lib/export/pdf/shared";
import { Core, Extra } from "@/lib/export/pdf/sections";
import { ContactLine, Header } from "@/lib/export/pdf/header";

export function ResumeDocument({ resume, paper }: { resume: Resume; paper: PaperSize }) {
  const l = layout(resume);
  const { spec, size, gap, lineHeight, family } = l;
  return (
    <Document title={`${plainText(resume.basics.name) || "Resume"} - Resume`} author={plainText(resume.basics.name)} creator="Folio">
      <Page
        size={PAGE_SIZE[paper]}
        style={{ padding: MARGIN, fontFamily: family, fontSize: size, lineHeight, color: "#262626" }}
      >
        <Header resume={resume} l={l} />
        {visibleSections(resume).map((section) => (
          <View key={section.key} style={{ marginTop: 20 * gap * PX }}>
            <Heading title={section.title} spec={spec} size={size} />
            <View style={{ marginTop: 6 * gap * PX, gap: 12 * gap * PX }}>
              {section.extra ? <Extra section={section.extra} /> : <Core resume={resume} sectionKey={section.key} />}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export function CoverLetterDocument({ resume, paper }: { resume: Resume; paper: PaperSize }) {
  const l = layout(resume);
  const { basics } = resume;
  const paragraphs = resume.coverLetter.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const rule = l.spec.headerRule ?? { width: 1, color: "#d4d4d4" };
  return (
    <Document title={`${plainText(basics.name) || "Cover letter"} - Cover letter`} author={plainText(basics.name)} creator="Folio">
      <Page
        size={PAGE_SIZE[paper]}
        style={{ padding: MARGIN * 1.25, fontFamily: l.family, fontSize: l.size + 0.5, lineHeight: 1.55, color: "#262626" }}
      >
        <View style={{ textAlign: l.spec.align, borderBottomWidth: rule.width * PX, borderBottomColor: rule.color, paddingBottom: 9 }}>
          <Text
            style={{
              fontSize: l.size * 1.9,
              fontWeight: l.spec.name.bold ? "bold" : "normal",
              fontFamily: l.spec.displaySerif ? "Times-Roman" : undefined,
              color: "#0a0a0a",
              lineHeight: 1.2,
            }}
          >
            {pdfSafe(plainText(nameText(basics.name, l.spec)))}
          </Text>
          <ContactLine resume={resume} style={{ marginTop: 3 }} />
        </View>
        <View style={{ marginTop: 24, gap: 10 }}>
          {paragraphs.map((paragraph, i) => (
            <Text key={i}>{pdfSafe(paragraph)}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export function resumePdfBlob(resume: Resume, paper: PaperSize) {
  return pdf(<ResumeDocument resume={resume} paper={paper} />).toBlob();
}

export function coverLetterPdfBlob(resume: Resume, paper: PaperSize) {
  return pdf(<CoverLetterDocument resume={resume} paper={paper} />).toBlob();
}
