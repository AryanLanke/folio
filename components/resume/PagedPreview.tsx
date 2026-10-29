"use client";

import { useEffect, useRef, useState } from "react";
import { countPages, pageBreaks } from "@/lib/pages";
import { PAGE_MARGIN, PAPER, type PaperSize } from "@/lib/resume";

// Shows a document as a real page: scaled down to fit narrow screens, with dashed lines
// where the downloaded PDF will start a new page.
export default function PagedPreview({
  paper,
  toolbar,
  children,
}: {
  paper: PaperSize;
  toolbar?: React.ReactNode;
  // The page itself, drawn at full paper width
  children: React.ReactNode;
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
      {toolbar && <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">{toolbar}</div>}
      <p
        className={`mb-3 rounded-md px-3 py-2 text-xs font-bold ${
          pages === 1 ? "bg-accent/15 text-accent-ink" : "bg-warning/15 text-warning"
        }`}
      >
        {pages === 1
          ? "Fits on 1 page"
          : `${pages} pages — most resumes should be 1. Try smaller text, tight spacing or the Compact template.`}
      </p>

      <div ref={frameRef} className="w-full">
        <div style={{ width: size.width * scale, height: height * scale }}>
          <div
            ref={pageRef}
            className="relative origin-top-left shadow-2xl light:shadow-lg light:ring-1 light:ring-border"
            style={{ width: size.width, transform: `scale(${scale})` }}
          >
            {children}
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
