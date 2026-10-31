// Units, the layout for a resume's template, and the small pieces every part of the PDF uses:
// formatted text, section headings, bullets and the line that starts each entry.

import { Text, View } from "@react-pdf/renderer";
import { pdfSafe } from "@/lib/export/text";
import { type PaperSize, type Resume, toLines } from "@/lib/resume";
import { parseRich, plainText } from "@/lib/rich";
import { type TemplateSpec, layoutFor, upperRich } from "@/lib/templates";

export const PX = 0.75; // CSS pixels to PDF points
export const MARGIN = 36; // half an inch, matching the preview
export const PAGE_SIZE: Record<PaperSize, "LETTER" | "A4"> = { letter: "LETTER", a4: "A4" };
export const MUTED = "#525252";
// Links stay clickable but look like the text around them, which prints better
export const LINK = { color: MUTED, textDecoration: "none" } as const;

export type Layout = ReturnType<typeof layoutFor> & { size: number; family: string };

// Text with the bold, italic and underline made on the page
export function Rich({ text }: { text: string }) {
  return parseRich(text).map((span, i) => (
    <Text
      key={i}
      style={{
        fontWeight: span.bold ? "bold" : undefined,
        fontStyle: span.italic ? "italic" : undefined,
        textDecoration: span.underline ? "underline" : undefined,
      }}
    >
      {pdfSafe(span.text)}
    </Text>
  ));
}

export function layout(resume: Resume): Layout {
  const base = layoutFor(resume.style);
  return { ...base, size: base.fontSize * PX, family: base.spec.serif ? "Times-Roman" : "Helvetica" };
}

// The name as the template shows it: in capitals for some templates (the PDF fonts have no
// capitals style, so the letters themselves change)
export const nameText = (name: string, spec: TemplateSpec) => {
  const text = name || "Your Name";
  return spec.name.uppercase ? upperRich(text) : text;
};

export function Heading({ title, spec, size }: { title: string; spec: TemplateSpec; size: number }) {
  const { heading } = spec;
  // PDF fonts have no small caps, so those headings become slightly smaller capitals
  const caps = heading.uppercase || heading.smallCaps;
  const scale = heading.smallCaps ? heading.scale * 0.85 : heading.scale;
  return (
    <View
      minPresenceAhead={40}
      style={{
        borderBottomWidth: heading.rule * PX,
        borderBottomColor: heading.ruleColor,
        paddingBottom: heading.rule ? 2 : 0,
      }}
    >
      <Text
        style={{
          fontSize: size * scale,
          fontWeight: "bold",
          fontFamily: spec.displaySerif ? "Times-Roman" : undefined,
          color: heading.color,
          letterSpacing: size * scale * heading.letterSpacing,
        }}
      >
        {caps ? pdfSafe(plainText(title)).toUpperCase() : pdfSafe(plainText(title))}
      </Text>
    </View>
  );
}

export function Bullets({ text }: { text: string }) {
  const lines = toLines(text);
  if (lines.length === 0) return null;
  return (
    <View style={{ marginTop: 2 }}>
      {lines.map((line, i) => (
        <View key={i} style={{ flexDirection: "row", marginTop: i === 0 ? 0 : 1.5 }}>
          <Text style={{ width: 10 }}>•</Text>
          <Text style={{ flex: 1 }}>
            <Rich text={line} />
          </Text>
        </View>
      ))}
    </View>
  );
}

export function EntryLine({ bold, rest, start, end }: { bold: string; rest: string[]; start: string; end: string }) {
  const tail = rest.filter(Boolean);
  const dates = [start, end].filter(Boolean).join(" – ");
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ fontWeight: "bold", color: "#0a0a0a" }}>
          <Rich text={bold} />
        </Text>
        {bold && tail.length > 0 ? ", " : ""}
        <Rich text={tail.join(" — ")} />
      </Text>
      {dates && (
        <Text style={{ color: MUTED }}>
          <Rich text={dates} />
        </Text>
      )}
    </View>
  );
}
