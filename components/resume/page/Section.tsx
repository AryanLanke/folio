import { type Field, text } from "@/components/resume/page/fields";
import { plainText } from "@/lib/rich";
import { HTML_FONT, type TemplateSpec } from "@/lib/templates";

// One section of the page: its heading, styled by the template, then its entries
export default function Section({
  title,
  gap,
  spec,
  colorPicker,
  move,
  children,
}: {
  // The heading, and how to rename it when the page is editable
  title: Field;
  gap: number;
  spec: TemplateSpec;
  // The round colour dot at the end of the heading, when the page is editable
  colorPicker?: React.ReactNode;
  // Moves the whole section up or down the page; missing at the top or bottom
  move?: { up?: () => void; down?: () => void };
  children: React.ReactNode;
}) {
  const { heading } = spec;
  return (
    <section style={{ marginTop: 20 * gap }} className="group/section">
      <div className="relative">
        {move && (
          <div className="absolute -left-9 inset-y-0 flex items-center gap-0.5 pb-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/section:opacity-100">
            <MoveButton label={`Move ${plainText(title.value)} up`} onClick={move.up} direction="up" />
            <MoveButton label={`Move ${plainText(title.value)} down`} onClick={move.down} direction="down" />
          </div>
        )}
        <h2
          className="break-after-avoid font-bold"
          style={{
            fontSize: `${heading.scale}em`,
            letterSpacing: `${heading.letterSpacing}em`,
            textTransform: heading.uppercase ? "uppercase" : "none",
            fontVariant: heading.smallCaps ? "small-caps" : "normal",
            fontFamily: spec.displaySerif ? HTML_FONT.serif : undefined,
            color: heading.color,
            borderBottom: heading.rule ? `${heading.rule}px solid ${heading.ruleColor}` : "none",
            paddingBottom: heading.rule ? 3 : 0,
            paddingRight: colorPicker ? 28 : 0,
          }}
        >
          {text(title)}
        </h2>
        {colorPicker && (
          <div className="absolute inset-y-0 right-0 flex items-center pb-1">
            {colorPicker}
          </div>
        )}
      </div>
      <div className="flex flex-col" style={{ marginTop: 8 * gap, gap: 12 * gap }}>
        {children}
      </div>
    </section>
  );
}

// A small arrow in the page margin, for moving a section
function MoveButton({ label, onClick, direction }: { label: string; onClick?: () => void; direction: "up" | "down" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label}
      title={label}
      className="grid size-4 place-items-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:invisible"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={direction === "up" ? "M3.5 10 8 5.5l4.5 4.5" : "M3.5 6 8 10.5 12.5 6"} />
      </svg>
    </button>
  );
}
