// The top of the resume in the PDF: the name, job title and contact line.

import { Link, Text, View } from "@react-pdf/renderer";
import { pdfSafe } from "@/lib/export/text";
import { contactItems } from "@/lib/links";
import type { Resume } from "@/lib/resume";
import { plainText } from "@/lib/rich";
import { type Layout, LINK, MUTED, nameText, PX, Rich } from "@/lib/export/pdf/shared";

// Email, phone, city and links on one line; links stay clickable in the PDF
export function ContactLine({ resume, style }: { resume: Resume; style: { marginTop: number } }) {
  const items = contactItems(resume.basics, resume.style.links);
  if (items.length === 0) return null;
  return (
    <Text style={{ ...style, color: MUTED }}>
      {items.map((item, i) => (
        <Text key={i}>
          {i > 0 ? "   |   " : ""}
          {item.href ? (
            <Link src={item.href} style={LINK}>
              {pdfSafe(plainText(item.text))}
            </Link>
          ) : (
            <Rich text={item.text} />
          )}
        </Text>
      ))}
    </Text>
  );
}

export function Header({ resume, l }: { resume: Resume; l: Layout }) {
  const { basics } = resume;
  const { spec, size } = l;

  return (
    <View
      style={{
        textAlign: spec.align,
        borderBottomWidth: spec.headerRule ? spec.headerRule.width * PX : 0,
        borderBottomColor: spec.headerRule?.color ?? "#000",
        paddingBottom: spec.headerRule ? 8 : 0,
      }}
    >
      <Text
        style={{
          fontSize: size * spec.name.scale,
          fontWeight: spec.name.bold ? "bold" : "normal",
          letterSpacing: size * spec.name.scale * spec.name.letterSpacing,
          fontFamily: spec.displaySerif ? "Times-Roman" : undefined,
          color: "#0a0a0a",
          lineHeight: 1.2,
        }}
      >
        <Rich text={nameText(basics.name, spec)} />
      </Text>
      {basics.title ? (
        <Text
          style={{
            marginTop: 2,
            fontSize: size * 1.12,
            color: spec.title.color,
            fontWeight: spec.title.bold ? "bold" : "normal",
            fontStyle: spec.title.italic ? "italic" : "normal",
          }}
        >
          <Rich text={basics.title} />
        </Text>
      ) : null}
      <ContactLine resume={resume} style={{ marginTop: 4 }} />
    </View>
  );
}
