import { describe, expect, it } from "vitest";
import { countPages, pageBreaks } from "@/lib/pages";
import { PAGE_MARGIN, PAPER } from "@/lib/resume";

const { height } = PAPER.letter;
const usable = height - PAGE_MARGIN * 2;

describe("countPages", () => {
  it("counts a full or short sheet as one page", () => {
    expect(countPages(height, height, PAGE_MARGIN)).toBe(1);
    expect(countPages(300, height, PAGE_MARGIN)).toBe(1);
  });

  it("ignores a 1px overflow from browser rounding", () => {
    expect(countPages(height + 1, height, PAGE_MARGIN)).toBe(1);
  });

  it("adds a page once content really passes the bottom margin", () => {
    expect(countPages(height + 2, height, PAGE_MARGIN)).toBe(2);
    expect(countPages(PAGE_MARGIN * 2 + usable * 2, height, PAGE_MARGIN)).toBe(2);
    expect(countPages(PAGE_MARGIN * 2 + usable * 2 + 2, height, PAGE_MARGIN)).toBe(3);
  });
});

describe("pageBreaks", () => {
  it("has no breaks for one page", () => {
    expect(pageBreaks(1, height, PAGE_MARGIN)).toEqual([]);
  });

  it("places each break one page of content apart", () => {
    expect(pageBreaks(3, height, PAGE_MARGIN)).toEqual([PAGE_MARGIN + usable, PAGE_MARGIN + usable * 2]);
  });
});
