"use client";

import { useState } from "react";
import Menu, { MenuDivider, MenuLabel, menuItemClass } from "@/components/ui/Menu";
import { exportName, saveBlob } from "@/lib/export/text";
import type { PaperSize, Resume } from "@/lib/resume";

type Format = "pdf" | "docx";

// The resume and cover letter as PDF or Word. Files are generated in the browser; the export code
// loads only when first needed.
export default function DownloadMenu({
  resume,
  paper,
  onDownloaded,
}: {
  resume: Resume;
  paper: PaperSize;
  onDownloaded: () => void;
}) {
  const [exporting, setExporting] = useState(false);
  const hasLetter = resume.coverLetter.trim() !== "";

  const download = async (what: "resume" | "letter", format: Format) => {
    setExporting(true);
    try {
      let blob: Blob;
      if (format === "pdf") {
        const pdf = await import("@/lib/export/pdf");
        blob = await (what === "resume" ? pdf.resumePdfBlob(resume, paper) : pdf.coverLetterPdfBlob(resume, paper));
      } else {
        const docx = await import("@/lib/export/docx");
        blob = await docx.toBlob(what === "resume" ? docx.resumeDocx(resume, paper) : docx.coverLetterDocx(resume, paper));
      }
      saveBlob(blob, exportName(resume, what === "resume" ? "resume" : "cover-letter", format));
      onDownloaded();
    } catch {
      alert("Couldn't create the file. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Menu
      label={exporting ? "Preparing…" : "Download"}
      buttonClass="whitespace-nowrap rounded-full bg-accent px-3 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover sm:px-4"
    >
      <MenuLabel>Resume</MenuLabel>
      <button type="button" className={menuItemClass} disabled={exporting} onClick={() => download("resume", "pdf")}>
        PDF
        <span className="block text-xs font-normal text-muted">Best for applying online</span>
      </button>
      <button type="button" className={menuItemClass} disabled={exporting} onClick={() => download("resume", "docx")}>
        Word (.docx)
        <span className="block text-xs font-normal text-muted">For portals that ask for Word</span>
      </button>
      <MenuDivider />
      <MenuLabel>Cover letter</MenuLabel>
      <button type="button" className={menuItemClass} disabled={exporting || !hasLetter} onClick={() => download("letter", "pdf")}>
        PDF
      </button>
      <button type="button" className={menuItemClass} disabled={exporting || !hasLetter} onClick={() => download("letter", "docx")}>
        Word (.docx)
      </button>
      {!hasLetter && <p className="px-3 pb-2 text-xs text-muted">Write one in the Cover letter tab first.</p>}
    </Menu>
  );
}
