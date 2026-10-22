"use client";

import { useState } from "react";
import ResumePreview from "@/components/resume/ResumePreview";
import Menu from "@/components/ui/Menu";
import { PAPER, type PaperSize, type Resume, TEMPLATES, type TemplateName } from "@/lib/resume";

const NAMES = Object.keys(TEMPLATES) as TemplateName[];
// Each preview is the real page at a sixth of its size, cropped to its top part
const SCALE = 0.17;
const CROP = 0.62;

// Picks a template from small previews of the person's own resume in each one, so they can see
// the look before choosing. The previews are only drawn while the menu is open.
export default function TemplatePicker({
  resume,
  paper,
  onChange,
}: {
  resume: Resume;
  paper: PaperSize;
  onChange: (template: TemplateName) => void;
}) {
  const [open, setOpen] = useState(false);
  const size = PAPER[paper];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted">Template</span>
      <Menu
        align="left"
        onToggle={setOpen}
        panelClass="w-[min(34rem,calc(100vw-2rem))] p-3"
        buttonClass="flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background transition-opacity hover:opacity-90"
        label={
          <>
            {TEMPLATES[resume.style.template].label}
            <span className="text-[10px]" aria-hidden="true">
              ▾
            </span>
            <span className="sr-only">: change template</span>
          </>
        }
      >
        {open && (
          <div role="radiogroup" aria-label="Template" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {NAMES.map((name) => {
              const selected = name === resume.style.template;
              return (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={TEMPLATES[name].label}
                  onClick={() => onChange(name)}
                  className="group rounded-lg p-1.5 text-left transition-colors hover:bg-surface-hover"
                >
                  <div
                    className={`overflow-hidden rounded bg-white outline-2 outline-offset-2 transition-[outline-color] ${
                      selected ? "outline-accent" : "outline-transparent group-hover:outline-border"
                    }`}
                    style={{ width: size.width * SCALE, height: size.height * SCALE * CROP }}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none origin-top-left"
                      style={{ width: size.width, transform: `scale(${SCALE})` }}
                    >
                      <ResumePreview resume={{ ...resume, style: { ...resume.style, template: name } }} paper={paper} />
                    </div>
                  </div>
                  <span className={`mt-2 block text-xs font-semibold ${selected ? "text-accent" : "text-foreground"}`}>
                    {TEMPLATES[name].label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Menu>
    </div>
  );
}
