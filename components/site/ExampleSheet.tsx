"use client";

import ResumePreview from "@/components/resume/ResumePreview";
import { PAPER, type Resume } from "@/lib/resume";

const PAGE = PAPER.letter;

// A resume drawn as a real Letter page, shrunk to fit. The scale comes from the class (a --scale
// value per screen size), so it's right from the first paint, with no measuring and no jump.
// "crop" shows only the top part of the page, for thumbnails.
export default function ExampleSheet({
  resume,
  scaleClass,
  crop = 1,
}: {
  resume: Resume;
  scaleClass: string;
  crop?: number;
}) {
  return (
    <div
      className={`overflow-hidden rounded bg-white shadow-2xl light:shadow-lg light:ring-1 light:ring-border ${scaleClass}`}
      style={{ width: `calc(${PAGE.width}px * var(--scale))`, height: `calc(${PAGE.height * crop}px * var(--scale))` }}
    >
      {/* A picture of the page: inert, so its contact links can't be clicked, tabbed to or read out */}
      <div inert aria-hidden="true" className="origin-top-left" style={{ width: PAGE.width, transform: "scale(var(--scale))" }}>
        <ResumePreview resume={resume} paper="letter" />
      </div>
    </div>
  );
}
