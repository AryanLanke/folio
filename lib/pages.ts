// Page math for the preview, matching how the browser splits the printed PDF.
// The resume is one tall sheet; each printed page holds its height minus top and bottom margins.

export function countPages(contentHeight: number, pageHeight: number, margin: number) {
  const usable = pageHeight - margin * 2;
  // The 1px allowance stops subpixel rounding from reporting a phantom extra page
  return Math.max(1, Math.ceil((contentHeight - margin * 2 - 1) / usable));
}

// Where each new page starts, measured from the top of the sheet
export function pageBreaks(pages: number, pageHeight: number, margin: number) {
  const usable = pageHeight - margin * 2;
  return Array.from({ length: pages - 1 }, (_, i) => margin + usable * (i + 1));
}
