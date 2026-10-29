import TemplatePicker from "@/components/builder/TemplatePicker";
import FormatBar from "@/components/resume/FormatBar";
import { ColorSwatches } from "@/components/ui/ColorPicker";
import Segmented from "@/components/ui/Segmented";
import { PAPER, type PaperSize, type Resume, type ResumeStyle } from "@/lib/resume";
import { TEMPLATE_SPECS } from "@/lib/templates";

const FONT_OPTIONS: { value: ResumeStyle["fontSize"]; label: string }[] = [
  { value: "small", label: "S" },
  { value: "medium", label: "M" },
  { value: "large", label: "L" },
];

const SPACING_OPTIONS: { value: ResumeStyle["spacing"]; label: string }[] = [
  { value: "compact", label: "Tight" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Airy" },
];

const PAPER_OPTIONS = (Object.keys(PAPER) as PaperSize[]).map((value) => ({ value, label: PAPER[value].label }));

// "Labels" shows LinkedIn / GitHub as clickable words; "Full" shows the addresses (better for ATS)
const LINK_OPTIONS: { value: ResumeStyle["links"]; label: string }[] = [
  { value: "label", label: "Labels" },
  { value: "url", label: "Full" },
];

// The toolbar above the page: text formatting, template, sizes, paper, links and heading colour
export default function LayoutControls({
  resume,
  paper,
  showFormat,
  onStyle,
  onPaper,
}: {
  resume: Resume;
  paper: PaperSize;
  // Bold, italic and underline; only for the resume, not the cover letter
  showFormat: boolean;
  onStyle: (patch: Partial<ResumeStyle>) => void;
  onPaper: (paper: PaperSize) => void;
}) {
  return (
    <>
      {showFormat && <FormatBar />}
      <TemplatePicker resume={resume} paper={paper} onChange={(template) => onStyle({ template })} />
      <Segmented label="Text" options={FONT_OPTIONS} value={resume.style.fontSize} onChange={(fontSize) => onStyle({ fontSize })} />
      <Segmented label="Spacing" options={SPACING_OPTIONS} value={resume.style.spacing} onChange={(spacing) => onStyle({ spacing })} />
      <Segmented label="Paper" options={PAPER_OPTIONS} value={paper} onChange={onPaper} />
      <Segmented label="Links" options={LINK_OPTIONS} value={resume.style.links} onChange={(links) => onStyle({ links })} />
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted">Colour</span>
        <ColorSwatches
          value={resume.style.accent}
          fallback={TEMPLATE_SPECS[resume.style.template].heading.color}
          onChange={(accent) => onStyle({ accent })}
        />
      </div>
    </>
  );
}
