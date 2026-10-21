"use client";

import { useEffect, useRef, useState } from "react";
import ResumePreview from "@/components/resume/ResumePreview";
import { countPages, pageBreaks } from "@/lib/pages";
import { PAGE_MARGIN, PAPER, type PaperSize, type Resume } from "@/lib/resume";

// Shows the resume as a real page: scaled down to fit narrow screens,
// with dashed lines where the printed PDF will break onto a new page.
export default function PagedPreview({
  resume,
  paper,
  toolbar,
}: {
  resume: Resume;
  paper: PaperSize;
  toolbar?: React.ReactNode;
}) {
  const size = PAPER[paper];
  const frameRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number>(size.height);

  useEffect(() => {
    const frame = frameRef.current;
    const page = pageRef.current;
    if (!frame || !page) return;
    const observer = new ResizeObserver(() => {
      setScale(Math.min(1, frame.clientWidth / size.width));
      setHeight(page.offsetHeight);
    });
    observer.observe(frame);
    observer.observe(page);
    return () => observer.disconnect();
  }, [size.width]);

  const pages = countPages(height, size.height, PAGE_MARGIN);
  const breaks = pageBreaks(pages, size.height, PAGE_MARGIN);

  return (
    <div className="mx-auto w-full" style={{ maxWidth: size.width }}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">{toolbar}</div>
      <p
        className={`mb-3 rounded-md px-3 py-2 text-xs font-bold ${
          pages === 1 ? "bg-accent/15 text-accent" : "bg-amber-400/15 text-amber-300"
        }`}
      >
        {pages === 1
          ? "Fits on 1 page"
          : `${pages} pages — most resumes should be 1. Try smaller text or tight spacing.`}
      </p>

      <div ref={frameRef} className="w-full">
        <div style={{ width: size.width * scale, height: height * scale }}>
          <div
            ref={pageRef}
            className="relative origin-top-left shadow-2xl"
            style={{ width: size.width, transform: `scale(${scale})` }}
          >
            <ResumePreview resume={resume} paper={paper} />
            {breaks.map((top, i) => (
              <div
                key={top}
                className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-amber-400"
                style={{ top }}
              >
                <span className="absolute right-2 -top-6 rounded bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-black">
                  Page {i + 2} starts here
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
